import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  checkPermission,
  requestPermission,
  isPermissionGranted,
  PERMISSION_DESCRIPTIONS,
  openAppSettings,
} from '../utils/permissionsManager';
import { RESULTS } from 'react-native-permissions';

const usePermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState({});
  const [loading, setLoading] = useState(false);

  // Check if a permission is granted
  const checkPermissionStatus = useCallback(async (permissionType) => {
    setLoading(true);
    try {
      const status = await checkPermission(permissionType);
      setPermissionStatus(prev => ({ ...prev, [permissionType]: status }));
      return status;
    } catch (error) {
      console.error(`Error checking ${permissionType} permission:`, error);
      return RESULTS.DENIED;
    } finally {
      setLoading(false);
    }
  }, []);

  // Request a permission with optional explanation
  const requestPermissionWithExplanation = useCallback(async (permissionType, showExplanation = true) => {
    setLoading(true);

    try {
      // First check current status
      const currentStatus = await checkPermission(permissionType);

      // If already granted, return
      if (isPermissionGranted(currentStatus)) {
        setPermissionStatus(prev => ({ ...prev, [permissionType]: currentStatus }));
        return true;
      }

      // If blocked, prompt to open settings (always show this dialog)
      if (currentStatus === RESULTS.BLOCKED) {
        return new Promise((resolve) => {
          Alert.alert(
            'Permission Required',
            `${PERMISSION_DESCRIPTIONS[permissionType].message} Please enable this permission in your device settings.`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false)
              },
              {
                text: 'Open Settings',
                onPress: async () => {
                  await openAppSettings();
                  resolve(false);
                }
              }
            ],
            { cancelable: true }
          );
        });
      }

      // Skip explanation if not needed
      if (!showExplanation) {
        const result = await requestPermission(permissionType);
        setPermissionStatus(prev => ({ ...prev, [permissionType]: result }));
        return isPermissionGranted(result);
      }

      // Show explanation before requesting
      return new Promise((resolve) => {
        Alert.alert(
          PERMISSION_DESCRIPTIONS[permissionType].title,
          PERMISSION_DESCRIPTIONS[permissionType].message,
          [
            {
              text: 'Deny',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Allow',
              onPress: async () => {
                const result = await requestPermission(permissionType);
                setPermissionStatus(prev => ({ ...prev, [permissionType]: result }));
                resolve(isPermissionGranted(result));
              }
            }
          ],
          { cancelable: true }
        );
      });
    } catch (error) {
      console.error(`Error requesting ${permissionType} permission:`, error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    permissionStatus,
    loading,
    checkPermission: checkPermissionStatus,
    requestPermission: requestPermissionWithExplanation,
    isPermissionGranted,
  };
};

export default usePermissions;
