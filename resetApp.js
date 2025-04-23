/**
 * Reset App Script
 * 
 * This script clears AsyncStorage to reset the app state.
 * Run this script with: node resetApp.js
 */

const { exec } = require('child_process');

// Command to uninstall and reinstall the app in iOS simulator
const command = `
xcrun simctl uninstall booted com.vitsplit
sleep 2
cd /Users/shoaibansari/VitSplit && npx react-native run-ios
`;

console.log('Resetting app state...');
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log('App has been reset. Please check if the issue is fixed.');
});
