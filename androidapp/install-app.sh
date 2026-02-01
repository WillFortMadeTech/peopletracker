#!/bin/bash

echo "========================================="
echo "SageTracker Auto-Installation Script"
echo "========================================="

cd /app

# Set Gradle home to a writable location
export GRADLE_USER_HOME=/tmp/gradle
mkdir -p $GRADLE_USER_HOME

# Ensure .gradle directory is writable
mkdir -p /app/.gradle
chmod -R 777 /app/.gradle 2>/dev/null || true

# Download gradle wrapper jar if it doesn't exist
if [ ! -f "gradle/wrapper/gradle-wrapper.jar" ]; then
    echo "Downloading Gradle wrapper..."
    mkdir -p gradle/wrapper
    if command -v wget > /dev/null; then
        wget -q https://raw.githubusercontent.com/gradle/gradle/master/gradle/wrapper/gradle-wrapper.jar -O gradle/wrapper/gradle-wrapper.jar
    elif command -v curl > /dev/null; then
        curl -sL https://raw.githubusercontent.com/gradle/gradle/master/gradle/wrapper/gradle-wrapper.jar -o gradle/wrapper/gradle-wrapper.jar
    else
        echo "Error: Neither wget nor curl is available"
        exit 1
    fi
fi

# Wait for emulator to be ready
echo "Waiting for emulator to boot..."
MAX_WAIT=300  # 5 minutes
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
        echo "✓ Emulator is ready!"
        break
    fi
    sleep 5
    WAITED=$((WAITED + 5))
    echo "  Waiting... ($WAITED/${MAX_WAIT}s)"
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "✗ Emulator did not start within timeout"
    exit 1
fi

# Give it a few more seconds to settle
sleep 10

# Build the app
echo "Building SageTracker app..."
echo "Current Java version: $(java -version 2>&1 | head -1)"

# Install Java 17 if not present
if [ ! -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
    echo "Installing Java 17..."
    apt-get update -qq && apt-get install -y -qq openjdk-17-jdk > /dev/null 2>&1
fi

# Try to find and use Java 17 or 21
if [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
    export PATH=$JAVA_HOME/bin:$PATH
    echo "Switched to Java 17: $(java -version 2>&1 | head -1)"
elif [ -d "/usr/lib/jvm/java-21-openjdk-amd64" ]; then
    export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
    export PATH=$JAVA_HOME/bin:$PATH
    echo "Switched to Java 21: $(java -version 2>&1 | head -1)"
else
    echo "Warning: Could not find Java 17 or 21, using default Java 25"
fi

./gradlew --gradle-user-home=/tmp/gradle --project-cache-dir=/tmp/gradle-cache assembleDebug

if [ $? -ne 0 ]; then
    echo "✗ Build failed!"
    exit 1
fi

# Install the app
echo "Installing SageTracker app..."
adb install -r /app/app/build/outputs/apk/debug/app-debug.apk

if [ $? -eq 0 ]; then
    echo "========================================="
    echo "✓ SageTracker installed successfully!"
    echo "========================================="
    echo ""
    echo "Access the emulator at: http://localhost:6080"
    echo "Look for the 'SageTracker' app in the app drawer"
    echo ""
else
    echo "✗ Installation failed!"
    exit 1
fi
