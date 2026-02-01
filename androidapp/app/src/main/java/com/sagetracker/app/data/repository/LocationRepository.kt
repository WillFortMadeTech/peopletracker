package com.sagetracker.app.data.repository

import android.os.Build
import com.sagetracker.app.data.api.ApiService
import com.sagetracker.app.data.api.LocationData
import com.sagetracker.app.data.api.LocationRequest

sealed class LocationSaveResult {
    data class Success(val location: LocationData) : LocationSaveResult()
    data class Error(val message: String) : LocationSaveResult()
}

class LocationRepository(private val apiService: ApiService) {

    suspend fun saveLocation(
        latitude: Double,
        longitude: Double,
        accuracy: Float? = null,
        altitude: Double? = null,
        speed: Float? = null,
        bearing: Float? = null
    ): LocationSaveResult {
        return try {
            val request = LocationRequest(
                latitude = latitude,
                longitude = longitude,
                accuracy = accuracy,
                altitude = altitude,
                speed = speed,
                bearing = bearing,
                deviceId = getDeviceId()
            )

            val response = apiService.saveLocation(request)

            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.location != null) {
                    LocationSaveResult.Success(body.location)
                } else {
                    LocationSaveResult.Error(body?.error ?: "Failed to save location")
                }
            } else {
                LocationSaveResult.Error("Server error: ${response.code()}")
            }
        } catch (e: Exception) {
            LocationSaveResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun getLocationHistory(limit: Int = 100): List<LocationData> {
        return try {
            val response = apiService.getLocationHistory(limit)
            if (response.isSuccessful) {
                response.body()?.locations ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun getDeviceId(): String {
        return "${Build.MANUFACTURER}_${Build.MODEL}".replace(" ", "_")
    }
}
