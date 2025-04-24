import { PERMISSIONS, RESULTS, check, request, openSettings } from 'react-native-permissions';
import { Platform } from 'react-native';

// Define permissions descriptions
export const PERMISSION_DESCRIPTIONS = {
  camera: {
    title: 'Camera Access',
    message: 'VitSplit needs camera access so you can take photos for group profiles and expenses.'
  },
  photoLibrary: {
    title: 'Photo Library Access',
    message: 'VitSplit needs access to your photos to let you add images to groups and expenses.'
  },
  contacts: {
    title: 'Contacts Access',
    message: 'VitSplit needs access to your contacts to help you find and add friends to groups more easily.'
  },
  location: {
    title: 'Location Access',
    message: 'VitSplit needs location access to help you find nearby stores and services.'
  },
  sms: {
    title: 'SMS Access',
    message: 'VitSplit needs SMS access to send invitations to your contacts.'
  }
};

// Get the actual permission constant based on platform and permission type
const getPermission = (permissionType) => {
  switch (permissionType) {
    case 'camera':
      return Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA
      });
    case 'photoLibrary':
      return Platform.select({
        ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
        android: Platform.Version >= 33
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
      });
    case 'contacts':
      return Platform.select({
        ios: PERMISSIONS.IOS.CONTACTS,
        android: PERMISSIONS.ANDROID.READ_CONTACTS
      });
    case 'location':
      return Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      });
    case 'sms':
      return Platform.select({
        ios: null, // iOS doesn't have SMS permission
        android: PERMISSIONS.ANDROID.READ_SMS
      });
    default:
      return null;
  }
};

// Check if a permission result represents a granted state
export const isPermissionGranted = (status) => {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
};

// Check multiple permissions at once
export const checkMultiplePermissions = async (permissionTypes) => {
  const permissionStatuses = {};

  for (const type of permissionTypes) {
    const permission = getPermission(type);

    if (permission) {
      try {
        const status = await check(permission);
        permissionStatuses[type] = status;
      } catch (error) {
        console.error(`Error checking ${type} permission:`, error);
        permissionStatuses[type] = RESULTS.UNAVAILABLE;
      }
    } else {
      // Permission not available on this platform
      permissionStatuses[type] = RESULTS.UNAVAILABLE;
    }
  }

  return permissionStatuses;
};

// Request multiple permissions
export const requestMultiplePermissions = async (permissionTypes) => {
  const permissionResults = {};

  for (const type of permissionTypes) {
    const permission = getPermission(type);

    if (permission) {
      try {
        const result = await request(permission);
        permissionResults[type] = result;
      } catch (error) {
        console.error(`Error requesting ${type} permission:`, error);
        permissionResults[type] = RESULTS.DENIED;
      }
    } else {
      // Permission not available on this platform
      permissionResults[type] = RESULTS.UNAVAILABLE;
    }
  }

  return permissionResults;
};

// Open app settings
export const openAppSettings = async () => {
  try {
    await openSettings();
  } catch (error) {
    console.error('Error opening settings:', error);
  }
};

// Check and request permission in one method
const checkAndRequestPermission = async (permissionType) => {
  try {
    // First check if we already have the permission
    const permission = getPermission(permissionType);

    if (!permission) {
      console.warn(`Permission ${permissionType} not available on this platform`);
      return false;
    }

    // Check current permission status
    const status = await check(permission);

    // If already granted, return true
    if (isPermissionGranted(status)) {
      return true;
    }

    // If not granted, request it
    const result = await request(permission);

    // Return whether permission was granted
    return isPermissionGranted(result);
  } catch (error) {
    console.error(`Error checking/requesting ${permissionType} permission:`, error);
    return false;
  }
};

// Create a default export object with all the methods
const PermissionService = {
  checkMultiplePermissions,
  requestMultiplePermissions,
  isPermissionGranted,
  openAppSettings,
  checkAndRequestPermission,
  // Alias openAppSettings as openSettings for backward compatibility
  openSettings: openAppSettings
};

export default PermissionService;