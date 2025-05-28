import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Image, Modal, FlatList, TextInput, ActivityIndicator, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { availableColorThemes, availableDisplayModes, getThemeColors } from '../../theme/theme';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import ReactNativeModal from 'react-native-modal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';

const ProfileScreen = () => {
  const { isDarkMode, displayMode, colorTheme, setDisplayMode, setColorTheme, colors: themeColors } = useTheme();
  const { logout, userProfile, updateProfile } = useAuth();
  const navigation = useNavigation();

  // Modal states
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showDisplayModeModal, setShowDisplayModeModal] = useState(false);
  const [showEditProfileSheet, setShowEditProfileSheet] = useState(false);

  // Profile edit states
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  // Location field is removed
  const [editAltPhoneNumber, setEditAltPhoneNumber] = useState('');
  const [editProfileImage, setEditProfileImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Field validation states
  const [firstNameError, setFirstNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [altPhoneNumberError, setAltPhoneNumberError] = useState(false);

  // Initialize edit form with current user data when bottom sheet opens
  useEffect(() => {
    if (showEditProfileSheet && userProfile) {
      // Split the name into first and last name if available
      if (userProfile.name) {
        const nameParts = userProfile.name.split(' ');
        setEditFirstName(nameParts[0] || '');
        setEditLastName(nameParts.slice(1).join(' ') || '');
      } else {
        setEditFirstName('');
        setEditLastName('');
      }

      setEditUsername(userProfile.username || '');
      setEditEmail(userProfile.email || '');
      setEditAddress(userProfile.address || '');
      // Location field is removed
      setEditAltPhoneNumber(userProfile.altPhoneNumber || '');
      setEditProfileImage(userProfile.avatar || null);

      // Reset all error states
      setUpdateError('');
      setFirstNameError(false);
      setEmailError(false);
      setAltPhoneNumberError(false);
    }
  }, [showEditProfileSheet, userProfile]);

  // State for logout loading
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Show confirmation dialog
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              // Clear user data and navigate to login screen
              await logout();
              // No need to manually navigate - the AuthContext will handle this
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const toggleDarkMode = () => {
    setDisplayMode(isDarkMode ? 'light' : 'dark');
  };

  const handleSelectColorTheme = (themeId) => {
    setColorTheme(themeId);
    setShowThemeModal(false);
  };

  const handleSelectDisplayMode = (modeId) => {
    setDisplayMode(modeId);
    setShowDisplayModeModal(false);
  };

  const renderSettingItem = (icon, title, subtitle, rightElement, onPress) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: themeColors.surface }]}
      onPress={onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.1) }]}>
        <Icon name={icon} size={20} color={themeColors.primary.default} />
      </View>

      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: themeColors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>}
      </View>

      {rightElement || (
        <Icon
          name="chevron-forward"
          size={20}
          color={themeColors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  // Handle profile image selection with cropping
  const handleSelectImage = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => openCamera(),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => openGallery(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Open camera with cropping
  const openCamera = async () => {
    try {
      const image = await ImagePicker.openCamera({
        width: 500,
        height: 500,
        cropping: true,
        cropperCircleOverlay: true,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      });

      setEditProfileImage(image.path);
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Error opening camera:', error);
      }
    }
  };

  // Open gallery with cropping
  const openGallery = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 500,
        height: 500,
        cropping: true,
        cropperCircleOverlay: true,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      });

      setEditProfileImage(image.path);
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Error opening gallery:', error);
      }
    }
  };

  // Email validation regex
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !email || emailRegex.test(email);
  };

  // Phone number validation
  const isValidPhoneNumber = (phone) => {
    // Basic phone number validation - allows various formats
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return !phone || phoneRegex.test(phone);
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    // Reset all validation errors
    setFirstNameError(false);
    setEmailError(false);
    setAltPhoneNumberError(false);
    setUpdateError('');

    // Validate first name
    if (!editFirstName.trim()) {
      setFirstNameError(true);
      setUpdateError('Please enter your first name');
      return;
    }

    // Validate email format if provided
    if (editEmail.trim() && !isValidEmail(editEmail.trim())) {
      setEmailError(true);
      setUpdateError('Please enter a valid email address');
      return;
    }

    // Validate alternate phone number if provided
    if (editAltPhoneNumber.trim() && !isValidPhoneNumber(editAltPhoneNumber.trim())) {
      setAltPhoneNumberError(true);
      setUpdateError('Please enter a valid alternate phone number');
      return;
    }

    setIsUpdating(true);
    setUpdateError('');

    try {
      // Combine first and last name
      const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();

      // Prepare profile data
      const profileData = {
        name: fullName,
        username: editUsername.trim() || undefined,
        email: editEmail.trim() || undefined,
        address: editAddress.trim() || undefined,
        // Location field is removed from the profile
        altPhoneNumber: editAltPhoneNumber.trim() || undefined,
        avatar: editProfileImage,
      };

      // Update profile
      const success = await updateProfile(profileData);

      if (success) {
        setShowEditProfileSheet(false);
      } else {
        setUpdateError('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  // Function to get a color based on the name (for letter avatars)
  const getAvatarColor = (name) => {
    if (!name) return themeColors.primary.default;
    // Simple hash function to generate a consistent color for a name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      themeColors.primary.default,
      themeColors.success,
      themeColors.warning,
      themeColors.info,
      themeColors.danger
    ];
    return colors[hash % colors.length];
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaWrapper>
        <ScrollView
          style={[styles.container, { backgroundColor: themeColors.background }]}
          contentContainerStyle={styles.contentContainer}
        >
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface }]}>
          {userProfile?.avatar ? (
            <Image
              source={{ uri: userProfile.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.letterAvatar, { backgroundColor: getAvatarColor(userProfile?.name) }]}>
              <Text style={styles.letterAvatarText}>{getInitials(userProfile?.name)}</Text>
            </View>
          )}

          <Text style={[styles.name, { color: themeColors.text }]}>{userProfile?.name || 'User'}</Text>

          {userProfile?.username && (
            <Text style={[styles.username, { color: themeColors.textSecondary }]}>@{userProfile.username}</Text>
          )}

          {userProfile?.email && (
            <Text style={[styles.profileDetail, { color: themeColors.textSecondary }]}>
              <Icon name="mail-outline" size={14} color={themeColors.textSecondary} /> {userProfile.email}
            </Text>
          )}

          {/* Phone number, alternate phone number, address, and location are hidden from profile display */}

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.1) }]}
            onPress={() => setShowEditProfileSheet(true)}
          >
            <Text style={[styles.editButtonText, { color: themeColors.primary.default }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

      <View>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Settings</Text>

        {renderSettingItem(
          'moon-outline',
          'Dark Mode',
          'Toggle dark mode on/off',
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: themeColors.gray[300], true: themeColors.primary.default }}
            thumbColor={themeColors.white}
          />
        )}

        {renderSettingItem(
          'color-palette-outline',
          'Theme Color',
          `Current: ${availableColorThemes.find(t => t.id === colorTheme)?.name || 'Blue'}`,
          null,
          () => setShowThemeModal(true)
        )}

        {renderSettingItem(
          'contrast-outline',
          'Display Mode',
          `Current: ${availableDisplayModes.find(m => m.id === displayMode)?.name || 'System'}`,
          null,
          () => setShowDisplayModeModal(true)
        )}

        {renderSettingItem(
          'card-outline',
          'Payment',
          'UPI Integration',
          null,
          () => navigation.navigate('Payment')
        )}

        {renderSettingItem(
          'notifications-outline',
          'Notifications',
          'Manage notification settings'
        )}

        {renderSettingItem(
          'key-outline',
          'Password',
          'Set or change your password',
          null,
          () => navigation.navigate('Password')
        )}

        {renderSettingItem(
          'gift-outline',
          'Referral System',
          'Invite friends and earn rewards',
          null,
          () => navigation.navigate('Referral')
        )}

        {renderSettingItem(
          'lock-closed-outline',
          'Privacy',
          'Manage privacy settings'
        )}

        {renderSettingItem(
          'help-circle-outline',
          'Help & Support',
          'Get help or contact support'
        )}

        {renderSettingItem(
          'information-circle-outline',
          'About',
          'App version 1.0.0'
        )}

        {/* Debug options */}
        {renderSettingItem(
          'bug-outline',
          'Debug Tools',
          'Troubleshoot app issues'
        )}

        {renderSettingItem(
          'people-outline',
          'Contacts Debug',
          'Debug contacts permissions',
          null,
          () => navigation.navigate('ContactsDebug')
        )}

        {renderSettingItem(
          'call-outline',
          'Device Contacts Debug',
          'View all device contacts',
          null,
          () => navigation.navigate('DeviceContactsDebug')
        )}
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: themeColors.surface }]}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator size="small" color={themeColors.danger} style={styles.logoutIcon} />
        ) : (
          <Icon name="log-out-outline" size={20} color={themeColors.danger} style={styles.logoutIcon} />
        )}
        <Text style={[styles.logoutText, { color: themeColors.danger }]}>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Text>
      </TouchableOpacity>

      {/* Color Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: themeColors.surface }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Theme Color</Text>

            <FlatList
              data={availableColorThemes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.themeOption, {
                    borderColor: item.id === colorTheme ? themeColors.primary.default : 'transparent',
                  }]}
                  onPress={() => handleSelectColorTheme(item.id)}
                >
                  <View
                    style={[styles.colorSwatch, {
                      backgroundColor: getThemeColors(item.id).primary.default
                    }]}
                  />
                  <Text style={[styles.themeOptionText, { color: themeColors.text }]}>{item.name}</Text>
                  {item.id === colorTheme && (
                    <Icon name="checkmark" size={20} color={themeColors.primary.default} />
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: themeColors.gray[200] }]}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={{ color: themeColors.text }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Display Mode Selection Modal */}
      <Modal
        visible={showDisplayModeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDisplayModeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDisplayModeModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: themeColors.surface }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Display Mode</Text>

            <FlatList
              data={availableDisplayModes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.themeOption, {
                    borderColor: item.id === displayMode ? themeColors.primary.default : 'transparent',
                  }]}
                  onPress={() => handleSelectDisplayMode(item.id)}
                >
                  <Icon
                    name={item.id === 'light' ? 'sunny-outline' : item.id === 'dark' ? 'moon-outline' : 'contrast-outline'}
                    size={24}
                    color={themeColors.text}
                    style={styles.modeIcon}
                  />
                  <Text style={[styles.themeOptionText, { color: themeColors.text }]}>{item.name}</Text>
                  {item.id === displayMode && (
                    <Icon name="checkmark" size={20} color={themeColors.primary.default} />
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: themeColors.gray[200] }]}
              onPress={() => setShowDisplayModeModal(false)}
            >
              <Text style={{ color: themeColors.text }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      </ScrollView>

        {/* Edit Profile Bottom Sheet */}
        <ReactNativeModal
          isVisible={showEditProfileSheet}
          onBackdropPress={() => !isUpdating && setShowEditProfileSheet(false)}
          onBackButtonPress={() => !isUpdating && setShowEditProfileSheet(false)}
          onSwipeComplete={() => !isUpdating && setShowEditProfileSheet(false)}
          swipeDirection={['down']}
          propagateSwipe={true}
          style={styles.bottomSheetModal}
          backdropOpacity={0.5}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          useNativeDriverForBackdrop
          avoidKeyboard={true}
          statusBarTranslucent
        >
          <View style={[styles.bottomSheetContainer, { backgroundColor: themeColors.surface }]}>
            <View style={styles.bottomSheetHandle} />

            <ScrollView style={styles.bottomSheetContent}>
              <Text style={[styles.bottomSheetTitle, { color: themeColors.text }]}>Edit Profile</Text>

              {updateError ? (
                <Text style={[styles.errorText, { color: themeColors.danger }]}>{updateError}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.profileImageContainer}
                onPress={handleSelectImage}
              >
                {editProfileImage ? (
                  <Image
                    source={{ uri: editProfileImage }}
                    style={styles.profileImageEdit}
                  />
                ) : userProfile?.avatar ? (
                  <Image
                    source={{ uri: userProfile.avatar }}
                    style={styles.profileImageEdit}
                  />
                ) : (
                  <View style={[styles.letterAvatarEdit, { backgroundColor: getAvatarColor(userProfile?.name) }]}>
                    <Text style={styles.letterAvatarText}>{getInitials(userProfile?.name)}</Text>
                  </View>
                )}
                <View style={[styles.addImageButton, { backgroundColor: themeColors.primary.default }]}>
                  <Icon name="camera-outline" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>First Name*</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: firstNameError ? themeColors.danger : themeColors.border
                }]}
                placeholder="Enter your first name"
                placeholderTextColor={themeColors.textSecondary}
                value={editFirstName}
                onChangeText={(text) => {
                  setEditFirstName(text);
                  if (text.trim()) {
                    setFirstNameError(false);
                  }
                }}
              />
              {firstNameError && (
                <Text style={[styles.fieldErrorText, { color: themeColors.danger }]}>
                  First name is required
                </Text>
              )}

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Last Name</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border
                }]}
                placeholder="Enter your last name"
                placeholderTextColor={themeColors.textSecondary}
                value={editLastName}
                onChangeText={setEditLastName}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Username</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border
                }]}
                placeholder="Enter a username"
                placeholderTextColor={themeColors.textSecondary}
                value={editUsername}
                onChangeText={setEditUsername}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: emailError ? themeColors.danger : themeColors.border
                }]}
                placeholder="Enter your email"
                placeholderTextColor={themeColors.textSecondary}
                value={editEmail}
                onChangeText={(text) => {
                  setEditEmail(text);
                  if (!text.trim() || isValidEmail(text.trim())) {
                    setEmailError(false);
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError && (
                <Text style={[styles.fieldErrorText, { color: themeColors.danger }]}>
                  Please enter a valid email address
                </Text>
              )}

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Address</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, {
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border
                }]}
                placeholder="Enter your address"
                placeholderTextColor={themeColors.textSecondary}
                value={editAddress}
                onChangeText={setEditAddress}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Location field is hidden from both Profile and Edit Profile screens */}

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Alternate Phone Number (Optional)</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: altPhoneNumberError ? themeColors.danger : themeColors.border
                }]}
                placeholder="Enter alternate phone number"
                placeholderTextColor={themeColors.textSecondary}
                value={editAltPhoneNumber}
                onChangeText={(text) => {
                  setEditAltPhoneNumber(text);
                  if (!text.trim() || isValidPhoneNumber(text.trim())) {
                    setAltPhoneNumberError(false);
                  }
                }}
                keyboardType="phone-pad"
              />
              {altPhoneNumberError && (
                <Text style={[styles.fieldErrorText, { color: themeColors.danger }]}>
                  Please enter a valid phone number
                </Text>
              )}

              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: themeColors.primary.default }]}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.updateButtonText}>Update Profile</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: themeColors.border }]}
                onPress={() => setShowEditProfileSheet(false)}
                disabled={isUpdating}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ReactNativeModal>
      </SafeAreaWrapper>
    </GestureHandlerRootView>
  );
};

// Helper function to get color with opacity
const getColorWithOpacity = (color, opacity) => {
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

const styles = StyleSheet.create({
  phoneNumber: {
    fontSize: 14,
    marginTop: 4,
  },
  profileDetail: {
    fontSize: 14,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  letterAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  letterAvatarEdit: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
  },
  editButtonText: {
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontWeight: '500',
    fontSize: 16,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 8,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  modeIcon: {
    marginRight: 12,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 16,
  },
  modalCloseButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  bottomSheetModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDDDDD',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  bottomSheetContent: {
    padding: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profileImageEdit: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  addImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  updateButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldErrorText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
});

export default ProfileScreen;
