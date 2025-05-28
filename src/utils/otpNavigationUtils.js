/**
 * OTP Navigation Utilities
 * 
 * This file contains utility functions for navigating to the OTP verification screen
 * and handling the OTP verification flow.
 */

import { CommonActions } from '@react-navigation/native';

/**
 * Navigate to the OTP verification screen
 * 
 * This function navigates to the OTP verification screen using the most reliable approach.
 * It uses navigation.replace to prevent going back to the login screen.
 * 
 * @param {Object} navigation - The navigation object
 * @param {Object} params - The parameters to pass to the OTP verification screen
 * @param {string} params.phoneNumber - The full phone number with country code
 * @param {boolean} params.isNewUser - Whether the user is new or existing
 * @param {boolean} params.devMode - Whether the app is in development mode
 * @param {string} params.devMessage - The development mode message
 * @returns {boolean} - Whether the navigation was successful
 */
export const navigateToOTPVerification = (navigation, params) => {
  console.log('=== OTP NAVIGATION UTILS: NAVIGATE TO OTP VERIFICATION ===');
  console.log('Navigating to OTP verification screen with params:', params);

  try {
    // Use navigation.dispatch with CommonActions.replace for more reliable navigation
    navigation.dispatch(
      CommonActions.replace('OTPVerification', params)
    );
    console.log('Navigation to OTP verification screen successful');
    return true;
  } catch (error) {
    console.error('Error navigating to OTP verification screen:', error);
    
    // Fallback to navigation.replace
    try {
      navigation.replace('OTPVerification', params);
      console.log('Navigation to OTP verification screen successful using fallback');
      return true;
    } catch (fallbackError) {
      console.error('Error using fallback navigation to OTP verification screen:', fallbackError);
      return false;
    }
  }
};

/**
 * Navigate to the password login screen
 * 
 * This function navigates to the password login screen using the most reliable approach.
 * 
 * @param {Object} navigation - The navigation object
 * @param {Object} params - The parameters to pass to the password login screen
 * @param {string} params.phoneNumber - The full phone number with country code
 * @returns {boolean} - Whether the navigation was successful
 */
export const navigateToPasswordLogin = (navigation, params) => {
  console.log('=== OTP NAVIGATION UTILS: NAVIGATE TO PASSWORD LOGIN ===');
  console.log('Navigating to password login screen with params:', params);

  try {
    // Use navigation.dispatch with CommonActions.navigate for more reliable navigation
    navigation.dispatch(
      CommonActions.navigate('PasswordLogin', params)
    );
    console.log('Navigation to password login screen successful');
    return true;
  } catch (error) {
    console.error('Error navigating to password login screen:', error);
    
    // Fallback to navigation.navigate
    try {
      navigation.navigate('PasswordLogin', params);
      console.log('Navigation to password login screen successful using fallback');
      return true;
    } catch (fallbackError) {
      console.error('Error using fallback navigation to password login screen:', fallbackError);
      return false;
    }
  }
};
