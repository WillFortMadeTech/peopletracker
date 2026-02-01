# SageTracker Android App

Location tracking Android application that sends GPS coordinates to the backend every 60 seconds.

## Quick Start - One Command! 🚀

```bash
docker-compose up
```

That's it! This single command will:
1. Build the Android APK (automatically in the Dockerfile)
2. Start the Android emulator
3. Wait for the emulator to boot
4. Automatically install the SageTracker app

### What to expect

The first run takes a few minutes because it:
- Builds the APK using Gradle (one-time build during image creation)
- Starts the Android emulator
- Waits for Android to fully boot (2-3 minutes)
- Installs the pre-built APK

You'll see output like:
```
sagetracker-android  | =========================================
sagetracker-android  | SageTracker Auto-Installer
sagetracker-android  | =========================================
sagetracker-android  | Waiting for emulator to boot...
sagetracker-android  | ✓ Emulator ready!
sagetracker-android  | Installing SageTracker...
sagetracker-android  | ✓ SageTracker installed successfully!
sagetracker-android  | =========================================
```

### Using the App

1. **Create a user account** at http://localhost:3000
2. **Open the emulator** at http://localhost:6080 (noVNC web interface)
3. **Find SageTracker** in the app drawer and open it
4. **Login** with your credentials
5. **Grant location permissions** when prompted
6. Your location will be tracked and sent to the server every 60 seconds!

## How It Works

### Build Process (Multi-Stage Dockerfile)

The Dockerfile uses a two-stage build:

**Stage 1 - APK Builder:**
- Uses `gradle:8.12-jdk17` image
- Copies Android project files
- Runs `./gradlew assembleDebug`
- Produces `/build/app/build/outputs/apk/debug/app-debug.apk`

**Stage 2 - Android Emulator:**
- Uses `budtmo/docker-android:emulator_11.0` image
- Copies the pre-built APK from Stage 1 to `/apk/sagetracker.apk`
- Sets up an auto-installation script via supervisor
- Automatically installs the APK when emulator boots

### Network Configuration

The app connects to the backend using Docker service name:
- API URL: `http://app:3000`
- This works because both containers are on the `sagetracker-network`

## Rebuilding the App

If you make changes to the Android app code:

```bash
# Rebuild just the Android container
docker-compose build android-emulator

# Restart with the new build
docker-compose up android-emulator
```

The APK will be rebuilt from scratch and automatically installed.

## Architecture

- **Language**: Kotlin
- **UI**: Jetpack Compose + Material3
- **API**: Retrofit + OkHttp
- **Location**: Google Play Services Location API
- **Storage**: Encrypted SharedPreferences (security-crypto)
- **Background Service**: Foreground Service for continuous GPS tracking

## API Endpoints

- `POST /api/auth/mobile-login` - Login and get Bearer token
- `POST /api/location` - Save GPS location
- `GET /api/location` - Get location history

## Permissions

- `ACCESS_FINE_LOCATION` - GPS access
- `ACCESS_BACKGROUND_LOCATION` - Track when app is closed
- `FOREGROUND_SERVICE` - Run as foreground service
- `POST_NOTIFICATIONS` - Show tracking notification
- `INTERNET` - API communication

## Troubleshooting

### Emulator not showing

- Wait 2-3 minutes for full boot
- Check http://localhost:6080
- Check logs: `docker logs sagetracker-android -f`

### App not installed

Check the installation logs:
```bash
docker logs sagetracker-android -f | grep -A 20 "SageTracker Auto-Installer"
```

If installation failed, restart the container:
```bash
docker-compose restart android-emulator
```

### Need to reinstall the app

```bash
docker exec sagetracker-android adb install -r /apk/sagetracker.apk
```

### View app logs

```bash
docker exec sagetracker-android adb logcat | grep SageTracker
```

### Build failed

If you see build errors during `docker-compose build`:
1. Check that you have enough disk space
2. Check Docker has enough memory allocated (at least 4GB recommended)
3. Try building with more verbose output:
   ```bash
   docker-compose build --progress=plain android-emulator
   ```

### Emulator is slow

The emulator requires KVM for hardware acceleration. Ensure:
- You're running on Linux
- KVM is enabled: `ls -l /dev/kvm`
- Your user has access: `sudo usermod -aG kvm $USER` (then logout/login)

## Development Tips

### Connect via ADB

```bash
adb connect localhost:5555
adb devices
```

### Simulate GPS movement

You can send GPS coordinates to the emulator:
```bash
docker exec sagetracker-android adb emu geo fix -0.118092 51.509865
```

Or use the extended controls in the noVNC interface (three dots menu).

### Clear app data

```bash
docker exec sagetracker-android adb shell pm clear com.sagetracker.app
```
