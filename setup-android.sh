#!/bin/bash

echo "========================================="
echo "SageTracker Android Setup"
echo "========================================="
echo ""
echo "This script will:"
echo "  1. Wait for the emulator to boot"
echo "  2. Build the Android app"
echo "  3. Install it on the emulator"
echo ""

# Check if the container is running
if ! docker ps --format '{{.Names}}' | grep -q "^sagetracker-android$"; then
    echo "Error: Android emulator container is not running!"
    echo ""
    echo "Start it with:"
    echo "  docker-compose up -d"
    echo ""
    exit 1
fi

# Run the installation script inside the container
docker exec -it sagetracker-android /app/install-app.sh

echo ""
echo "Next steps:"
echo "  1. Open http://localhost:6080 in your browser"
echo "  2. Open the SageTracker app"
echo "  3. Login with your credentials"
echo "  4. Grant location permissions"
echo ""
