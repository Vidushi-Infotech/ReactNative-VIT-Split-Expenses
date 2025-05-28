/**
 * Script to clear AsyncStorage flags that might be causing navigation issues
 */

const { exec } = require('child_process');

// List of flags to clear
const flagsToClear = [
  'isRegistering',
  'navigatingToPasswordCreation',
  'currentRegistrationStep',
  'NAVIGATE_TO_PASSWORD_CREATION',
  'PASSWORD_CREATION_PHONE',
  'FORCE_NAVIGATE_TO_PASSWORD_CREATION',
  'FORCE_NAVIGATE_PHONE_NUMBER',
  'EMERGENCY_NAVIGATE_TO',
  'EMERGENCY_NAVIGATE_PARAMS',
  'forceNavigateToMain',
  'forceNavigateToGroups',
  'forceNavigateToMainLowercase',
  'BLOCK_MAIN_NAVIGATION',
  'forceReload'
];

// Command to clear each flag
flagsToClear.forEach(flag => {
  const command = `adb shell "run-as com.vitsplit cmd package exec-app com.vitsplit com.facebook.react.modules.storage.AsyncStorageModule clear '${flag}'"`;
  
  console.log(`Clearing flag: ${flag}`);
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error clearing ${flag}: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error clearing ${flag}: ${stderr}`);
      return;
    }
    console.log(`Successfully cleared ${flag}`);
  });
});

// Alternative approach: Clear all AsyncStorage
const clearAllCommand = `adb shell "run-as com.vitsplit cmd package exec-app com.vitsplit com.facebook.react.modules.storage.AsyncStorageModule clear"`;

console.log('Attempting to clear all AsyncStorage...');
exec(clearAllCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error clearing all AsyncStorage: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error clearing all AsyncStorage: ${stderr}`);
    return;
  }
  console.log('Successfully cleared all AsyncStorage');
});

// Restart the app
const restartAppCommand = `adb shell am force-stop com.vitsplit && adb shell am start -n com.vitsplit/.MainActivity`;

console.log('Restarting the app...');
exec(restartAppCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error restarting app: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error restarting app: ${stderr}`);
    return;
  }
  console.log('App restarted successfully');
});
