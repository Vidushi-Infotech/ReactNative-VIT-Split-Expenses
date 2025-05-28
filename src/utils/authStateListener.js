/**
 * Authentication State Listener
 * 
 * This file contains a utility to listen for authentication state changes
 * and trigger a callback when the state changes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Store for the current authentication state
let currentAuthState = null;

// Store for the callback function
let authStateChangeCallback = null;

/**
 * Initialize the authentication state listener
 * 
 * @param {Function} callback - The callback to call when the authentication state changes
 */
export const initAuthStateListener = (callback) => {
  console.log('Initializing authentication state listener');
  authStateChangeCallback = callback;
  
  // Start polling for authentication state changes
  startPolling();
};

/**
 * Start polling for authentication state changes
 */
const startPolling = () => {
  console.log('Starting polling for authentication state changes');
  
  // Check the authentication state every 500ms
  const interval = setInterval(async () => {
    try {
      // Check if the user is authenticated
      const userProfileData = await AsyncStorage.getItem('userProfile');
      const isAuthenticated = !!userProfileData;
      
      // If the authentication state has changed, call the callback
      if (isAuthenticated !== currentAuthState) {
        console.log('Authentication state changed:', { isAuthenticated });
        currentAuthState = isAuthenticated;
        
        // Call the callback if it exists
        if (authStateChangeCallback) {
          authStateChangeCallback(isAuthenticated);
        }
      }
    } catch (error) {
      console.error('Error checking authentication state:', error);
    }
  }, 500);
  
  // Return the interval so it can be cleared later
  return interval;
};

/**
 * Force authentication state
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
