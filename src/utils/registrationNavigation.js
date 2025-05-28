import AsyncStorage from '@react-native-async-storage/async-storage';

// Registration navigation states
export const REGISTRATION_STATES = {
  NONE: 'NONE',
  OTP_VERIFIED: 'OTP_VERIFIED',
  PASSWORD_CREATED: 'PASSWORD_CREATED',
  PROFILE_SETUP: 'PROFILE_SETUP',
  COMPLETED: 'COMPLETED'
};

// Set the current registration state
export const setRegistrationState = async (state, data = {}) => {
  try {
    console.log(`Setting registration state to: ${state}`, data);
    
    // Store the state
    await AsyncStorage.setItem('registrationState', state);
    
    // Store any additional data
    if (Object.keys(data).length > 0) {
      await AsyncStorage.setItem('registrationData', JSON.stringify(data));
    }
    
    return true;
  } catch (error) {
    console.error('Error setting registration state:', error);
    return false;
  }
};

// Get the current registration state
export const getRegistrationState = async () => {
  try {
    const state = await AsyncStorage.getItem('registrationState');
    const dataString = await AsyncStorage.getItem('registrationData');
    
    const data = dataString ? JSON.parse(dataString) : {};
    
    return {
      state: state || REGISTRATION_STATES.NONE,
      data
    };
  } catch (error) {
    console.error('Error getting registration state:', error);
    return {
      state: REGISTRATION_STATES.NONE,
      data: {}
    };
  }
};

// Clear the registration state
export const clearRegistrationState = async () => {
  try {
    await AsyncStorage.removeItem('registrationState');
    await AsyncStorage.removeItem('registrationData');
    return true;
  } catch (error) {
    console.error('Error clearing registration state:', error);
    return false;
  }
};

// Set a flag to force navigation to a specific screen
export const forceNavigationToScreen = async (screenName, params = {}) => {
  try {
    console.log(`Setting force navigation to screen: ${screenName}`, params);
    
    // Store the screen name and params
    await AsyncStorage.setItem('forceNavigationScreen', screenName);
    await AsyncStorage.setItem('forceNavigationParams', JSON.stringify(params));
    
    // Set a flag to indicate that force navigation is enabled
    await AsyncStorage.setItem('forceNavigation', 'true');
    
    return true;
  } catch (error) {
    console.error('Error setting force navigation:', error);
    return false;
  }
};

// Check if force navigation is enabled
export const isForceNavigationEnabled = async () => {
  try {
    const forceNavigation = await AsyncStorage.getItem('forceNavigation');
    return forceNavigation === 'true';
  } catch (error) {
    console.error('Error checking force navigation:', error);
    return false;
  }
};

// Get the force navigation screen and params
export const getForceNavigationDetails = async () => {
  try {
    const screen = await AsyncStorage.getItem('forceNavigationScreen');
    const paramsString = await AsyncStorage.getItem('forceNavigationParams');
    
    const params = paramsString ? JSON.parse(paramsString) : {};
    
    return {
      screen,
      params
    };
  } catch (error) {
    console.error('Error getting force navigation details:', error);
    return {
      screen: null,
      params: {}
    };
  }
};

// Clear the force navigation flags
export const clearForceNavigation = async () => {
  try {
    await AsyncStorage.removeItem('forceNavigation');
    await AsyncStorage.removeItem('forceNavigationScreen');
    await AsyncStorage.removeItem('forceNavigationParams');
    return true;
  } catch (error) {
    console.error('Error clearing force navigation:', error);
    return false;
  }
};
