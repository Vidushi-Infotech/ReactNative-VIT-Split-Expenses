#!/bin/bash

# Change to the project directory
cd "/Users/smali/Documents/React Native/ReactNative-VIT-Split-Expenses"

# Kill any existing Metro processes
pkill -f "node.*metro" || true

# Set environment variables
export ANDROID_SDK_ROOT=/Users/smali/Library/Android/sdk
export PATH=$PATH:/Users/smali/Library/Android/sdk/platform-tools

# Get the device ID
DEVICE_ID=$(/Users/smali/Library/Android/sdk/platform-tools/adb devices | grep -v "List" | grep "device" | head -1 | cut -f1)
echo "Using device: $DEVICE_ID"

# Set up reverse port forwarding
/Users/smali/Library/Android/sdk/platform-tools/adb -s $DEVICE_ID reverse tcp:8081 tcp:8081

# Get the computer's IP address
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "Computer IP: $IP_ADDRESS"

# Start Metro bundler in the background
npx react-native start --host 0.0.0.0 &
METRO_PID=$!

# Wait for Metro to start
sleep 5

# Build and install the app
npx react-native run-android --device $DEVICE_ID --no-packager

# Open the dev menu and reload
/Users/smali/Library/Android/sdk/platform-tools/adb -s $DEVICE_ID shell input keyevent 82
echo "Dev menu opened. Please select 'Reload' manually."

echo "App should be running now. If you still see 'Unable to load script', try these steps:"
echo "1. Open the dev menu (shake the device or press menu button)"
echo "2. Select 'Settings'"
echo "3. Select 'Debug server host & port for device'"
echo "4. Enter: $IP_ADDRESS:8081"
echo "5. Go back and select 'Reload'"

# Keep the script running to keep Metro alive
echo "Press Ctrl+C to exit"
wait $METRO_PID
