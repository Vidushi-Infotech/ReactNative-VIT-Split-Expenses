#!/bin/bash

# Set up the Android SDK environment variables
export ANDROID_HOME=/Users/smali/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator

# Check if the emulator is running
if ! $ANDROID_HOME/platform-tools/adb devices | grep -q "emulator"; then
  echo "Starting the emulator..."
  $ANDROID_HOME/emulator/emulator -avd Pixel_9_Pro_XL_Edited_API_34 -no-snapshot-load &
  # Wait for the emulator to boot
  echo "Waiting for the emulator to boot..."
  $ANDROID_HOME/platform-tools/adb wait-for-device
  sleep 10
fi

# Start the Metro bundler if it's not already running
if ! lsof -i:8081 | grep -q "node"; then
  echo "Starting Metro bundler..."
  npx react-native start &
  sleep 5
fi

# Run the app on the Android emulator
echo "Running the app on the Android emulator..."
npx react-native run-android
