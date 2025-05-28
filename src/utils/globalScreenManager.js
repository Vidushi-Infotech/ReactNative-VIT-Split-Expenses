import AsyncStorage from '@react-native-async-storage/async-storage';
import { Subject } from 'rxjs';

// Screen names
export const SCREENS = {
  LOGIN: 'LOGIN',
  OTP_VERIFICATION: 'OTP_VERIFICATION',
  PASSWORD_CREATION: 'PASSWORD_CREATION',
  PROFILE_SETUP: 'PROFILE_SETUP',
  MAIN: 'MAIN'
};

// Subject for screen changes
const screenChangeSubject = new Subject();

// Current screen state
let currentScreen = SCREENS.LOGIN;
let currentParams = {};

// Get the current screen
export const getCurrentScreen = () => {
  return {
    screen: currentScreen,
    params: currentParams
  };
};

// Set the current screen
export const setCurrentScreen = async (screen, params = {}) => {
  try {
    console.log(`GlobalScreenManager: Setting current screen to ${screen}`, params);

    // Update the current screen
    currentScreen = screen;
    currentParams = params;

    // Store the screen in AsyncStorage
    await AsyncStorage.setItem('globalScreen', screen);
    await AsyncStorage.setItem('globalScreenParams', JSON.stringify(params));

    // Notify subscribers
    screenChangeSubject.next({
      screen,
      params
    });

    return true;
  } catch (error) {
    console.error('GlobalScreenManager: Error setting current screen:', error);
    return false;
  }
};

// Subscribe to screen changes
export const subscribeToScreenChanges = (callback) => {
  return screenChangeSubject.subscribe(callback);
};

// Initialize the screen manager
export const initializeScreenManager = async () => {
  try {
    console.log('GlobalScreenManager: Initializing');

    // Get the screen from AsyncStorage
    const screen = await AsyncStorage.getItem('globalScreen');
    const paramsString = await AsyncStorage.getItem('globalScreenParams');

    // If there's a stored screen, use it
    if (screen) {
      const params = paramsString ? JSON.parse(paramsString) : {};

      console.log(`GlobalScreenManager: Restoring screen ${screen}`, params);

      // Update the current screen
      currentScreen = screen;
      currentParams = params;

      // Notify subscribers
      screenChangeSubject.next({
        screen,
        params
      });
    }

    return true;
  } catch (error) {
    console.error('GlobalScreenManager: Error initializing:', error);
    return false;
  }
};

// Clear the screen state
export const clearScreenState = async () => {
  try {
    await AsyncStorage.removeItem('globalScreen');
    await AsyncStorage.removeItem('globalScreenParams');
    return true;
  } catch (error) {
    console.error('GlobalScreenManager: Error clearing screen state:', error);
    return false;
  }
};

// Navigation functions
export const navigateToLogin = async (params = {}) => {
  return setCurrentScreen(SCREENS.LOGIN, params);
};

export const navigateToOTPVerification = async (params = {}) => {
  return setCurrentScreen(SCREENS.OTP_VERIFICATION, params);
};

export const navigateToPasswordCreation = async (params = {}) => {
  return setCurrentScreen(SCREENS.PASSWORD_CREATION, params);
};

export const navigateToProfileSetup = async (params = {}) => {
  return setCurrentScreen(SCREENS.PROFILE_SETUP, params);
};

export const navigateToMain = async (params = {}) => {
  return setCurrentScreen(SCREENS.MAIN, params);
};
