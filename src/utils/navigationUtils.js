/**
 * Navigation Utilities
 *
 * This file contains utility functions for navigation.
 */

import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Set a flag to force navigation to Main screen
 *
 * This function sets a flag in AsyncStorage that will be checked by App.js
 * to force navigation to the Main screen on the next render.
 *
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const setForceNavigateToMainFlag = async () => {
  console.log('=== SET FORCE NAVIGATE TO MAIN FLAG ===');

  try {
    // Set a flag in AsyncStorage to indicate that we want to navigate to Main
    await AsyncStorage.setItem('forceNavigateToMain', 'true');

    // Set a timestamp to force a re-render
    await AsyncStorage.setItem('forceReload', Date.now().toString());

    console.log('Force navigate to Main flag set successfully');
    return true;
  } catch (error) {
    console.error('Error setting force navigate to Main flag:', error);
    return false;
  }
};

/**
 * Clear the force navigate to Main flag
 *
 * This function clears the flag in AsyncStorage that forces navigation to the Main screen.
 *
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const clearForceNavigateToMainFlag = async () => {
  console.log('=== CLEAR FORCE NAVIGATE TO MAIN FLAG ===');

  try {
    // Clear the flag in AsyncStorage
    await AsyncStorage.removeItem('forceNavigateToMain');

    console.log('Force navigate to Main flag cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing force navigate to Main flag:', error);
    return false;
  }
};

/**
 * Navigate to the Main screen
 *
 * This function navigates to the Main screen using the most reliable approach.
 * It tries multiple approaches in sequence until one works.
 *
 * @param {Object} navigation - The navigation object
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const navigateToMain = async (navigation) => {
  console.log('=== NAVIGATE TO MAIN ===');

  try {
    // Set the force navigate to Main flag
    await setForceNavigateToMainFlag();

    // First, try to get the root navigation
    const rootNavigation = navigation.getParent();

    if (rootNavigation) {
      console.log('Using root navigation to reset to Main');

      // Try to reset the navigation stack using the root navigation
      try {
        rootNavigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
        console.log('Navigation to Main successful using root navigation');
        return true;
      } catch (rootError) {
        console.error('Error navigating to Main using root navigation:', rootError);
      }
    }

    // If root navigation failed or is not available, try direct reset
    console.log('Using direct reset to navigate to Main');

    try {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
      console.log('Navigation to Main successful using direct reset');
      return true;
    } catch (directError) {
      console.error('Error navigating to Main using direct reset:', directError);
    }

    // If direct reset failed, try navigate
    console.log('Using navigate to go to Main');

    try {
      navigation.navigate('Main');
      console.log('Navigation to Main successful using navigate');
      return true;
    } catch (navigateError) {
      console.error('Error navigating to Main using navigate:', navigateError);
    }

    // If all navigation attempts failed, just return false
    // The flag we set earlier will be checked by App.js
    console.log('All navigation attempts failed, relying on the flag in AsyncStorage');
    return false;
  } catch (error) {
    console.error('Error in navigateToMain:', error);
    return false;
  }
};
