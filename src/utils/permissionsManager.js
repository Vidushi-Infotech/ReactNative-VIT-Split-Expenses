import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  request,
  checkMultiple,
  requestMultiple,
  openSettings,
} from 'react-native-permissions';

// Define permissions by platform
const PLATFORM_PERMISSIONS = {
  ios: {
    camera: PERMISSIONS.IOS.CAMERA,
    photoLibrary: PERMISSIONS.IOS.PHOTO_LIBRARY,
    contacts: PERMISSIONS.IOS.CONTACTS,
    location: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    sms: null, // iOS doesn't have SMS permission
  },
  android: {
    camera: PERMISSIONS.ANDROID.CAMERA,
    photoLibrary: Platform.Version >= 33 
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES 
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    contacts: PERMISSIONS.ANDROID.READ_CONTACTS,
    location: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    sms: PERMISSIONS.ANDROID.READ_SMS,
  },
};

// Get the correct permission based on platform
const getPermission = (permissionType) => {
  const platform = Platform.OS;
  return PLATFORM_PERMISSIONS[platform][permissionType];
};

// Check a single permission
export const checkPermission = async (permissionType) => {
  const permission = getPermission(permissionType);
  
  // If the permission doesn't exist for this platform
  if (!permission) {
    return RESULTS.UNAVAILABLE;
  }
  
  try {
    const result = await check(permission);
    return result;
  } catch (error) {
    console.error(`Error checking ${permissionType} permission:`, error);
    return RESULTS.DENIED;
  }
};

// Request a single permission
export const requestPermission = async (permissionType) => {
  const permission = getPermission(permissionType);
  
  // If the permission doesn't exist for this platform
  if (!permission) {
    return RESULTS.UNAVAILABLE;
  }
  
  try {
    const result = await request(permission);
    return result;
  } catch (error) {
    console.error(`Error requesting ${permissionType} permission:`, error);
    return RESULTS.DENIED;
  }
};

// Check multiple permissions at once
export const checkMultiplePermissions = async (permissionTypes) => {
  const platform = Platform.OS;
  const permissionsToCheck = {};
  
  // Filter out unavailable permissions for the platform
  permissionTypes.forEach(type => {
    const permission = PLATFORM_PERMISSIONS[platform][type];
    if (permission) {
      permissionsToCheck[permission] = permission;
    }
  });
  
  try {
    const statuses = await checkMultiple(Object.values(permissionsToCheck));
    return statuses;
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    return {};
  }
};

// Request multiple permissions at once
export const requestMultiplePermissions = async (permissionTypes) => {
  const platform = Platform.OS;
  const permissionsToRequest = {};
  
  // Filter out unavailable permissions for the platform
  permissionTypes.forEach(type => {
    const permission = PLATFORM_PERMISSIONS[platform][type];
    if (permission) {
      permissionsToRequest[permission] = permission;
    }
  });
  
  try {
    const statuses = await requestMultiple(Object.values(permissionsToRequest));
    return statuses;
  } catch (error) {
    console.error('Error requesting multiple permissions:', error);
    return {};
  }
};

// Open app settings
export const openAppSettings = async () => {
  try {
    await openSettings();
    return true;
  } catch (error) {
    console.error('Error opening settings:', error);
    return false;
  }
};

// Helper function to check if permission is granted
export const isPermissionGranted = (status) => {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
};

// Permission descriptions for user-friendly messages
export const PERMISSION_DESCRIPTIONS = {
  camera: {
    title: 'Camera Permission',
    message: 'VitSplit needs access to your camera to take profile pictures.',
  },
  photoLibrary: {
    title: 'Photo Library Permission',
    message: 'VitSplit needs access to your photo library to select profile pictures.',
  },
  contacts: {
    title: 'Contacts Permission',
    message: 'VitSplit needs access to your contacts to help you find and add friends to split expenses with.',
  },
  location: {
    title: 'Location Permission',
    message: 'VitSplit needs access to your location to find nearby places for expense tracking.',
  },
  sms: {
    title: 'SMS Permission',
    message: 'VitSplit needs access to your SMS messages for verification purposes.',
  },
};
