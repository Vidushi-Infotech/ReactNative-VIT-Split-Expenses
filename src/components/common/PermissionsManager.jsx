import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Modal } from 'react-native';
import { RESULTS } from 'react-native-permissions';
import {
  checkMultiplePermissions,
  requestMultiplePermissions,
  PERMISSION_DESCRIPTIONS,
  openAppSettings,
} from '../../utils/permissionsManager';
import { useTheme } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const PermissionsManager = ({ children }) => {
  const { colors: themeColors } = useTheme();
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [currentPermission, setCurrentPermission] = useState(null);
  const [permissionResults, setPermissionResults] = useState({});

  // List of permissions to request
  const permissionsToRequest = [
    'camera',
    'photoLibrary',
    'contacts',
    'location',
    'sms',
    // Notification permissions are handled separately in NotificationContext
  ];

  // Check permissions when component mounts
  useEffect(() => {
    const initPermissions = async () => {
      // Check all permissions
      await checkPermissions();
    };

    initPermissions();
  }, []);

  // Check all required permissions
  const checkPermissions = async () => {
    const statuses = await checkMultiplePermissions(permissionsToRequest);
    setPermissionResults(statuses);
    setPermissionsChecked(true);
  };

  // Request a specific permission - simplified to minimize popups
  const requestPermission = async (permissionType) => {
    // Skip the modal and directly request the permission
    const result = await requestMultiplePermissions([permissionType]);
    setPermissionResults({ ...permissionResults, ...result });

    // Only show alerts for blocked permissions that require settings access
    const permissionValues = Object.values(result);
    if (permissionValues.length > 0) {
      const status = permissionValues[0];

      if (status === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          `${PERMISSION_DESCRIPTIONS[permissionType].message} Please enable this permission in your device settings.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openAppSettings }
          ],
          { cancelable: true }
        );
      }
    }
  };

  // These functions are kept for compatibility but simplified
  const handleRequestPermission = async () => {
    setShowPermissionModal(false);
    if (currentPermission) {
      await requestPermission(currentPermission);
      setCurrentPermission(null);
    }
  };

  const handleCancelPermission = () => {
    setShowPermissionModal(false);
    setCurrentPermission(null);
  };

  // If permissions are still being checked, show nothing
  if (!permissionsChecked) {
    return null;
  }

  // We'll only show the modal for critical permissions that need explanation
  // For most permissions, we'll use the system dialog directly
  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* Permission explanation modal - only shown in special cases */}
      {showPermissionModal && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancelPermission}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
              <Icon
                name={
                  currentPermission === 'camera' ? 'camera' :
                  currentPermission === 'photoLibrary' ? 'images' :
                  currentPermission === 'contacts' ? 'people' :
                  currentPermission === 'location' ? 'location' :
                  currentPermission === 'sms' ? 'chatbubble' : 'alert-circle'
                }
                size={40}
                color={themeColors.primary.default}
                style={styles.icon}
              />

              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {currentPermission && PERMISSION_DESCRIPTIONS[currentPermission].title}
              </Text>

              <Text style={[styles.modalMessage, { color: themeColors.textSecondary }]}>
                {currentPermission && PERMISSION_DESCRIPTIONS[currentPermission].message}
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { borderColor: themeColors.border }]}
                  onPress={handleCancelPermission}
                >
                  <Text style={[styles.buttonText, { color: themeColors.textSecondary }]}>Deny</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.allowButton, { backgroundColor: themeColors.primary.default }]}
                  onPress={handleRequestPermission}
                >
                  <Text style={[styles.buttonText, styles.allowButtonText]}>Allow</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  allowButton: {
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  allowButtonText: {
    color: '#FFFFFF',
  },
});

export default PermissionsManager;
