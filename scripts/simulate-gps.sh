#!/bin/bash

# GPS Simulation Script for SageTracker Android Emulator
# This script cycles through various coordinates to simulate movement

CONTAINER_NAME="sagetracker-android"

# Check if the container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container '${CONTAINER_NAME}' is not running."
    echo "Start it with: docker-compose up -d android-emulator"
    exit 1
fi

# Array of locations (longitude latitude format for adb emu geo fix)
# Format: "longitude latitude name"
LOCATIONS=(
    "-0.1276 51.5074 London-BigBen"
    "-0.1180 51.5094 London-StPaulsCathedral"
    "-0.0759 51.5080 London-TowerOfLondon"
    "-0.1426 51.5014 London-BuckinghamPalace"
    "-0.1534 51.4998 London-VictoriaStation"
    "-0.1248 51.5008 London-WestminsterBridge"
    "-0.1281 51.5080 London-LeicesterSquare"
    "-0.1418 51.5013 London-GreenPark"
)

echo "Starting GPS simulation for SageTracker..."
echo "Press Ctrl+C to stop"
echo ""

# Trap Ctrl+C to exit gracefully
trap 'echo -e "\nStopping GPS simulation."; exit 0' INT

index=0
while true; do
    location="${LOCATIONS[$index]}"
    lon=$(echo "$location" | cut -d' ' -f1)
    lat=$(echo "$location" | cut -d' ' -f2)
    name=$(echo "$location" | cut -d' ' -f3)

    echo "[$(date '+%H:%M:%S')] Setting location: $name ($lat, $lon)"

    # Send GPS coordinates to emulator
    docker exec "$CONTAINER_NAME" adb emu geo fix "$lon" "$lat" 2>/dev/null

    if [ $? -ne 0 ]; then
        echo "Warning: Failed to set location. Is the emulator ready?"
    fi

    # Move to next location
    index=$(( (index + 1) % ${#LOCATIONS[@]} ))

    # Wait 60 seconds before next update
    sleep 60
done
