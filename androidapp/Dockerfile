# ===========================
# Stage 1: Build the APK
# ===========================
FROM cimg/android:2024.01 AS builder

USER root

WORKDIR /build

# Copy gradle files first for caching
COPY gradle/ gradle/
COPY gradlew gradlew.bat gradle.properties settings.gradle.kts build.gradle.kts ./

# Make gradlew executable
RUN chmod +x gradlew

# Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon || true

# Copy app source
COPY app/ app/

# Build the APK
RUN ./gradlew assembleDebug --no-daemon

# Verify APK was created
RUN ls -lh /build/app/build/outputs/apk/debug/app-debug.apk

# ===========================
# Stage 2: Android Emulator
# ===========================
FROM budtmo/docker-android:emulator_11.0

USER root

# Fix the broken root user issue
RUN echo "root:x:0:0:root:/root:/bin/bash" >> /etc/passwd || true

# Create directory for the APK
RUN mkdir -p /apk && chmod 755 /apk

# Copy the pre-built APK from builder stage
COPY --from=builder /build/app/build/outputs/apk/debug/app-debug.apk /apk/sagetracker.apk

# Verify APK was copied
RUN ls -lh /apk/sagetracker.apk

# Create installation script
RUN echo '#!/bin/bash\n\
\n\
echo "========================================="\n\
echo "SageTracker Auto-Installer"\n\
echo "========================================="\n\
\n\
# Wait for emulator to boot\n\
echo "Waiting for emulator to boot..."\n\
MAX_WAIT=300\n\
WAITED=0\n\
while [ $WAITED -lt $MAX_WAIT ]; do\n\
    if adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then\n\
        echo "✓ Emulator is ready!"\n\
        break\n\
    fi\n\
    sleep 5\n\
    WAITED=$((WAITED + 5))\n\
    echo "  Waiting... ($WAITED/${MAX_WAIT}s)"\n\
done\n\
\n\
if [ $WAITED -ge $MAX_WAIT ]; then\n\
    echo "ERROR: Emulator failed to boot within timeout"\n\
    exit 1\n\
fi\n\
\n\
echo "Waiting 10 seconds for system to stabilize..."\n\
sleep 10\n\
\n\
# Install the pre-built APK\n\
echo "Installing SageTracker from /apk/sagetracker.apk..."\n\
if adb install -r /apk/sagetracker.apk; then\n\
    echo "========================================="\n\
    echo "✓ SageTracker installed successfully!"\n\
    echo "========================================="\n\
    echo ""\n\
    echo "Access emulator at http://localhost:6080"\n\
    echo "Look for SageTracker in the app drawer"\n\
    echo ""\n\
else\n\
    echo "ERROR: Install failed"\n\
    echo "APK info:"\n\
    ls -lh /apk/sagetracker.apk\n\
    exit 1\n\
fi\n\
' > /usr/local/bin/install-sagetracker.sh && chmod +x /usr/local/bin/install-sagetracker.sh

# Create entrypoint wrapper that starts the original entrypoint and then installs the app
RUN echo '#!/bin/bash\n\
\n\
# Start the install script in background after a delay\n\
(\n\
    sleep 30\n\
    /usr/local/bin/install-sagetracker.sh\n\
) &\n\
\n\
# Execute the original entrypoint\n\
exec sh -c "${APP_PATH}/mixins/scripts/run.sh"\n\
' > /usr/local/bin/entrypoint-wrapper.sh && chmod +x /usr/local/bin/entrypoint-wrapper.sh

# Switch back to container user
USER androidusr

WORKDIR /home/androidusr

# Override entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint-wrapper.sh"]
