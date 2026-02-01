# PeopleTracker

A secure location sharing and tracking application that allows users to share their real-time location with trusted contacts. Built with privacy and security at its core.

## Overview

PeopleTracker enables users to create accounts and securely share their location with family, friends, or colleagues. The system supports multiple authentication methods, guest access via expiring links, and location-based notifications.

## Features

### Authentication
- **Custom Authentication** - Email/password registration and login
- **OAuth Integration** - Sign in with popular identity providers
- **Guest Access** - Time-limited access via expiry links for temporary sharing

### Location Sharing
- **Real-time Tracking** - Share your location with approved contacts
- **Secure Data Management** - All location data is encrypted and securely stored
- **Granular Permissions** - Control who can see your location and when

### Notifications
- **Location-based Push Notifications** - Get notified when contacts arrive at or leave specific locations
- **Geofencing** - Set up custom zones for automated alerts

### Sharing
- **Guest Links** - Generate temporary sharing links for non-registered users
- **Expiry Controls** - Set time limits on shared access

## Architecture

### Web Application
- **Framework**: Next.js (React)
- **Database**: AWS DynamoDB
- **Infrastructure**: Docker with LocalStack for local development

### Mobile Application (Android)
A native Android app built with Kotlin and Jetpack Compose:
- **Background Location Tracking** - Sends GPS coordinates every 60 seconds
- **Foreground Service** - Keeps tracking active even when app is backgrounded
- **Encrypted Storage** - Secure token storage using EncryptedSharedPreferences
- **Docker Emulator** - Built-in emulator accessible via web browser (noVNC)

## Getting Started

### Prerequisites
- Docker and Docker Compose
- `/dev/kvm` for hardware acceleration (optional, but recommended for emulator)

### Quick Start

1. Clone the repository

2. Start all services:
   ```bash
   docker-compose up
   ```

   This single command will:
   - Build the Android APK automatically
   - Start the web app at http://localhost:3000
   - Start the Android emulator at http://localhost:6080
   - Start LocalStack at http://localhost:4566
   - Wait for the emulator to boot
   - Automatically install the SageTracker Android app

   First run takes a few minutes for the emulator to boot and app to install.

3. Create a user account at http://localhost:3000

4. Access the emulator at http://localhost:6080, open "SageTracker" app, and login

5. (Optional) Simulate GPS movement:
   ```bash
   docker exec sagetracker-android adb emu geo fix -0.118092 51.509865
   ```

## Project Structure

```
├── app/                   # Next.js web application
│   ├── app/api/          # API routes (auth, location, friends, etc.)
│   └── lib/              # Backend utilities (DynamoDB, auth, etc.)
├── androidapp/           # Android application (Kotlin)
│   ├── app/src/main/    # Source code (data, ui, service layers)
│   └── README.md        # Android-specific documentation
├── localstack/          # LocalStack configuration for local AWS
│   └── init-dynamodb.sh # DynamoDB table creation
├── scripts/
│   └── simulate-gps.sh  # GPS simulation for testing
├── docker-compose.yml   # Service orchestration
└── setup-android.sh     # Automated Android app installer
```

## Security

- All location data is encrypted in transit and at rest
- OAuth 2.0 compliant authentication flows
- Session management with secure token handling
- Guest links with configurable expiration

## License

[MIT](LICENSE)

---

*This project is mostly hand-written but aided by [Claude](https://claude.ai), Anthropic's AI assistant.*
