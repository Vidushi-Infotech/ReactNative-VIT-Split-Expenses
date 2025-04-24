import { Platform, NativeModules } from 'react-native';

/**
 * Utility function to check if the react-native-contacts module is properly linked
 * @returns {Object} Status of the contacts module
 */
export const checkContactsModuleStatus = () => {
  const status = {
    isAvailable: false,
    nativeModuleAvailable: false,
    jsModuleAvailable: false,
    error: null
  };

  try {
    // Check if the native module is available
    const ContactsManager = NativeModules.ContactsManager;
    status.nativeModuleAvailable = !!ContactsManager;

    // Try to import the JS module
    const Contacts = require('react-native-contacts').default;
    status.jsModuleAvailable = !!Contacts && typeof Contacts.getAll === 'function';
    
    // Overall availability
    status.isAvailable = status.nativeModuleAvailable && status.jsModuleAvailable;
    
    return status;
  } catch (error) {
    status.error = error.message;
    return status;
  }
};

/**
 * Utility function to get platform-specific details for debugging
 * @returns {Object} Platform details
 */
export const getPlatformDetails = () => {
  return {
    os: Platform.OS,
    version: Platform.Version,
    isAndroid: Platform.OS === 'android',
    isIOS: Platform.OS === 'ios',
  };
};

export default {
  checkContactsModuleStatus,
  getPlatformDetails
};
