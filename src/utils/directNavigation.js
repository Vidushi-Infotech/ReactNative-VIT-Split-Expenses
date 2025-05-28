/**
 * Direct Navigation Utilities
 *
 * This file contains utility functions to directly navigate to specific screens
 * without relying on the navigation system.
 *
 * EMERGENCY NAVIGATION SYSTEM - Use when normal navigation fails
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, BackHandler } from 'react-native';

/**
 * Set a flag to force navigation to the Main screen
 *
 * @returns {Promise<void>}
 */
export const setDirectNavigationToMain = async () => {
  try {
    // Set a flag in AsyncStorage
    await AsyncStorage.setItem('DIRECT_NAVIGATION_TO_MAIN', 'true');

    // Set a timestamp to force a re-render
    await AsyncStorage.setItem('DIRECT_NAVIGATION_TIMESTAMP', Date.now().toString());

    console.log('Direct navigation to Main flag set successfully');

    // Show an alert to inform the user
    Alert.alert(
      'Success',
      'You have been successfully authenticated. The app will now restart to apply the changes.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Exit the app to force a restart
            BackHandler.exitApp();
          }
        }
      ]
    );
  } catch (error) {
    console.error('Error setting direct navigation to Main flag:', error);
  }
};

/**
 * Check if direct navigation to Main is enabled
 *
 * @returns {Promise<boolean>}
 */
export const isDirectNavigationToMainEnabled = async () => {
  try {
    // Get the flag from AsyncStorage
    const flag = await AsyncStorage.getItem('DIRECT_NAVIGATION_TO_MAIN');

    // Return true if the flag is set to 'true'
    return flag === 'true';
  } catch (error) {
    console.error('Error checking direct navigation to Main flag:', error);
    return false;
  }
};

/**
 * Clear the direct navigation flag
 *
 * @returns {Promise<void>}
 */
export const clearDirectNavigationFlag = async () => {
  try {
    // Clear the flag in AsyncStorage
    await AsyncStorage.removeItem('DIRECT_NAVIGATION_TO_MAIN');

    console.log('Direct navigation flag cleared successfully');
  } catch (error) {
    console.error('Error clearing direct navigation flag:', error);
  }
};

/**
 * Force navigation to the Groups screen by setting flags in AsyncStorage
 * This is a last resort approach when normal navigation methods fail
 *
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const forceNavigateToGroups = async () => {
  try {
    console.log('Setting force navigation flags for Groups screen');

    // Set authentication flag
    await AsyncStorage.setItem('isAuthenticated', 'true');

    // Set navigation flags
    await AsyncStorage.setItem('FORCE_NAVIGATE_TO_GROUPS', 'true');
    await AsyncStorage.setItem('FORCE_RELOAD', Date.now().toString());

    // Set a flag to force app reload
    await AsyncStorage.setItem('FORCE_APP_RELOAD', Date.now().toString());

    // No alerts - just log the action
    console.log('Force navigation to Groups initiated');

    return true;
  } catch (error) {
    console.error('Error setting force navigation flags:', error);
    return false;
  }
};

/**
 * Clear all navigation flags
 *
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const clearAllNavigationFlags = async () => {
  try {
    await AsyncStorage.removeItem('DIRECT_NAVIGATION_TO_MAIN');
    await AsyncStorage.removeItem('FORCE_NAVIGATE_TO_GROUPS');
    await AsyncStorage.removeItem('FORCE_RELOAD');
    await AsyncStorage.removeItem('FORCE_APP_RELOAD');
    console.log('All navigation flags cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing navigation flags:', error);
    return false;
  }
};
