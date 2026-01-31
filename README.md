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

### Mobile Application
A companion mobile app (iOS/Android) is required for location tracking. The mobile app:
- Runs in the background to collect location data
- Securely transmits location updates to the server
- Handles push notification delivery

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+

### Local Development

1. Clone the repository
2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
3. Start the services:
   ```bash
   docker-compose up
   ```
4. Access the app at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                  # Next.js web application
│   ├── app/              # App router pages and API routes
│   └── lib/              # Shared libraries (DynamoDB client, etc.)
├── localstack/           # LocalStack configuration for local AWS services
└── docker-compose.yml    # Container orchestration
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
