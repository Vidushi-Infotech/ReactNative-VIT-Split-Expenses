/**
 * Navigation Helper
 * 
 * This file contains helper functions for navigation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Force authentication state to trigger navigation to Main screen
 * 
 * This function directly manipulates the AsyncStorage to force the app
 * to recognize the user as authenticated. This is a workaround for the
 * issue where the app doesn't automatically navigate to the Main screen
 * after successful authentication.
 * 
 * @param {Object} userProfile - The user profile to save
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const forceAuthenticationState = async (userProfile) => {
  try {
    console.log('=== FORCE AUTHENTICATION STATE ===');
    console.log('Forcing authentication state with profile:', userProfile);
    
    // Ensure the profile has a password or currentPassword
    const profile = {
      ...userProfile,
      // Add a dummy password if none exists
      password: userProfile.password || userProfile.currentPassword || 'temp-password-' + Date.now(),
    };
    
    // Save the profile to AsyncStorage
    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
    
    // Set the hasLaunched flag to true
    await AsyncStorage.setItem('hasLaunched', 'true');
    
    console.log('Authentication state forced successfully');
    return true;
  } catch (error) {
    console.error('Error forcing authentication state:', error);
    return false;
  }
};

/**
 * Force app reload
 * 
 * This function forces the app to reload by manipulating AsyncStorage
 * in a way that triggers the app to re-render.
 * 
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const forceAppReload = async () => {
  try {
    console.log('=== FORCE APP RELOAD ===');
    
    // Set a timestamp in AsyncStorage to force a re-render
    await AsyncStorage.setItem('forceReload', Date.now().toString());
    
    console.log('App reload forced successfully');
    return true;
  } catch (error) {
    console.error('Error forcing app reload:', error);
    return false;
  }
};
