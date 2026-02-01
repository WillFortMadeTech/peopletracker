package com.sagetracker.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.sagetracker.app.MainActivity
import com.sagetracker.app.SageTrackerApplication
import com.sagetracker.app.data.repository.LocationSaveResult
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class LocationTrackingService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var notificationManager: NotificationManager

    private var lastUpdateTime: Long = 0
    private var consecutiveFailures: Int = 0
    private var totalLocationsSent: Int = 0

    companion object {
        private const val TAG = "LocationTrackingService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "location_tracking_channel"
        private const val LOCATION_INTERVAL_MS = 60_000L // 1 minute
        private const val MAX_CONSECUTIVE_FAILURES = 5
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        notificationManager = getSystemService(NotificationManager::class.java)
        createNotificationChannel()
        setupLocationCallback()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification(TrackingStatus.STARTING))
        startLocationUpdates()
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        serviceScope.cancel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows location tracking status"
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private enum class TrackingStatus {
        STARTING,
        ACTIVE,
        SENDING,
        SUCCESS,
        ERROR,
        PERMISSION_DENIED,
        STOPPED
    }

    private fun createNotification(status: TrackingStatus, extraInfo: String? = null): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val (title, text, icon) = when (status) {
            TrackingStatus.STARTING -> Triple(
                "SageTracker",
                "Starting location tracking...",
                android.R.drawable.ic_menu_mylocation
            )
            TrackingStatus.ACTIVE -> {
                val timeStr = if (lastUpdateTime > 0) {
                    val sdf = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
                    "Last update: ${sdf.format(Date(lastUpdateTime))}"
                } else {
                    "Waiting for location..."
                }
                Triple(
                    "SageTracker - Active",
                    "$timeStr | Sent: $totalLocationsSent",
                    android.R.drawable.ic_menu_mylocation
                )
            }
            TrackingStatus.SENDING -> Triple(
                "SageTracker",
                "Sending location...",
                android.R.drawable.ic_menu_upload
            )
            TrackingStatus.SUCCESS -> Triple(
                "SageTracker - Active",
                "Location sent successfully | Total: $totalLocationsSent",
                android.R.drawable.ic_menu_mylocation
            )
            TrackingStatus.ERROR -> Triple(
                "SageTracker - Error",
                extraInfo ?: "Failed to send location (retry $consecutiveFailures/$MAX_CONSECUTIVE_FAILURES)",
                android.R.drawable.ic_dialog_alert
            )
            TrackingStatus.PERMISSION_DENIED -> Triple(
                "SageTracker - Permission Required",
                "Location permission not granted. Tap to fix.",
                android.R.drawable.ic_dialog_alert
            )
            TrackingStatus.STOPPED -> Triple(
                "SageTracker - Stopped",
                extraInfo ?: "Tracking stopped",
                android.R.drawable.ic_media_pause
            )
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(icon)
            .setContentIntent(pendingIntent)
            .setOngoing(status != TrackingStatus.STOPPED && status != TrackingStatus.ERROR)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOnlyAlertOnce(true)
            .build()
    }

    private fun updateNotification(status: TrackingStatus, extraInfo: String? = null) {
        notificationManager.notify(NOTIFICATION_ID, createNotification(status, extraInfo))
    }

    private fun setupLocationCallback() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    Log.d(TAG, "Location received: ${location.latitude}, ${location.longitude}")
                    updateNotification(TrackingStatus.SENDING)
                    sendLocationToServer(
                        latitude = location.latitude,
                        longitude = location.longitude,
                        accuracy = location.accuracy,
                        altitude = location.altitude,
                        speed = location.speed,
                        bearing = location.bearing
                    )
                }
            }
        }
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            LOCATION_INTERVAL_MS
        ).apply {
            setMinUpdateIntervalMillis(LOCATION_INTERVAL_MS / 2)
            setWaitForAccurateLocation(false)
        }.build()

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
            Log.d(TAG, "Location updates started")
            updateNotification(TrackingStatus.ACTIVE)
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission not granted", e)
            updateNotification(TrackingStatus.PERMISSION_DENIED)
        }
    }

    private fun stopLocationUpdates() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        Log.d(TAG, "Location updates stopped")
    }

    private fun sendLocationToServer(
        latitude: Double,
        longitude: Double,
        accuracy: Float,
        altitude: Double,
        speed: Float,
        bearing: Float
    ) {
        val app = application as SageTrackerApplication
        val locationRepository = app.locationRepository

        serviceScope.launch {
            val result = locationRepository.saveLocation(
                latitude = latitude,
                longitude = longitude,
                accuracy = accuracy,
                altitude = altitude,
                speed = speed,
                bearing = bearing
            )

            when (result) {
                is LocationSaveResult.Success -> {
                    Log.d(TAG, "Location saved: ${result.location.id}")
                    lastUpdateTime = System.currentTimeMillis()
                    totalLocationsSent++
                    consecutiveFailures = 0
                    updateNotification(TrackingStatus.SUCCESS)

                    // After a short delay, show active status with last update time
                    kotlinx.coroutines.delay(2000)
                    updateNotification(TrackingStatus.ACTIVE)
                }
                is LocationSaveResult.Error -> {
                    Log.e(TAG, "Failed to save location: ${result.message}")
                    consecutiveFailures++

                    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                        updateNotification(
                            TrackingStatus.ERROR,
                            "Connection failed. Check network. (${result.message})"
                        )
                    } else {
                        updateNotification(
                            TrackingStatus.ERROR,
                            "Send failed: ${result.message} (retry $consecutiveFailures/$MAX_CONSECUTIVE_FAILURES)"
                        )
                        // After showing error, retry will happen on next location update
                        kotlinx.coroutines.delay(3000)
                        updateNotification(TrackingStatus.ACTIVE)
                    }
                }
            }
        }
    }
}
