/**
 * Force Navigation Utilities
 * 
 * This file contains utility functions to force navigation to specific screens.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Force navigation to the Main screen
 * 
 * This function sets a flag in AsyncStorage that will be checked by App.js
 * to force navigation to the Main screen on the next render.
 * 
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const forceNavigationToMain = async () => {
  try {
    // Set a flag in AsyncStorage to indicate that we want to navigate to Main
    await AsyncStorage.setItem('FORCE_NAVIGATION_TO_MAIN', 'true');
    
    // Set a timestamp to force a re-render
    await AsyncStorage.setItem('FORCE_NAVIGATION_TIMESTAMP', Date.now().toString());
    
    console.log('Force navigation to Main flag set successfully');
    return true;
  } catch (error) {
    console.error('Error setting force navigation to Main flag:', error);
    return false;
  }
};

/**
 * Clear the force navigation flag
 * 
 * This function clears the flag in AsyncStorage that forces navigation to a specific screen.
 * 
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const clearForceNavigationFlag = async () => {
  try {
    // Clear the flag in AsyncStorage
    await AsyncStorage.removeItem('FORCE_NAVIGATION_TO_MAIN');
    
    console.log('Force navigation flag cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing force navigation flag:', error);
    return false;
  }
};

/**
 * Check if force navigation to Main is enabled
 * 
 * This function checks if the flag in AsyncStorage that forces navigation to the Main screen is set.
 * 
 * @returns {Promise<boolean>} - Whether force navigation to Main is enabled
 */
export const isForceNavigationToMainEnabled = async () => {
  try {
    // Get the flag from AsyncStorage
    const flag = await AsyncStorage.getItem('FORCE_NAVIGATION_TO_MAIN');
    
    // Return true if the flag is set to 'true'
    return flag === 'true';
  } catch (error) {
    console.error('Error checking force navigation to Main flag:', error);
    return false;
  }
};
