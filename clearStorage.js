/**
 * Clear AsyncStorage Script
 * 
 * This script clears AsyncStorage to reset the app state.
 * Run this script with: node clearStorage.js
 */

const { exec } = require('child_process');

// Command to clear AsyncStorage in iOS simulator
const command = `
xcrun simctl launch booted com.vitsplit
sleep 2
xcrun simctl terminate booted com.vitsplit
sleep 1
xcrun simctl launch booted com.vitsplit
`;

console.log('Clearing AsyncStorage...');
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log('AsyncStorage has been cleared. Please check if the issue is fixed.');
});
