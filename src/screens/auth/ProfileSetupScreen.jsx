import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator, Alert, Platform, ActionSheetIOS } from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import usePermissions from '../../hooks/usePermissions';

const ProfileSetupScreen = ({ navigation, route }) => {
  const { phoneNumber, referralCode = '', referredBy = '', emergency = false, superEmergency = false } = route.params;
  const { isDarkMode, colors: themeColors } = useTheme();
  const { setupProfile } = useAuth();
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [referralCodeInput, setReferralCodeInput] = useState(referralCode);
  const [referredByInput, setReferredByInput] = useState(referredBy);
  const [loading, setLoading] = useState(false);

  // Log navigation state for debugging
  console.log('ProfileSetupScreen loaded with params:', route.params);
  console.log('emergency flag:', emergency);
  console.log('superEmergency flag:', superEmergency);
  console.log('Current navigation state:', navigation.getState());

  const handleProfileSetup = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      // Prepare profile data
      const profileData = {
        name: name.trim(),
        username: username.trim() || undefined,
        avatar: profileImage,
        phoneNumber: phoneNumber, // Include the phone number
        updatedAt: new Date().toISOString(),
      };

      // Add referral information if provided
      if (referralCodeInput && referralCodeInput.trim()) {
        profileData.usedReferralCode = referralCodeInput.trim();
      }

      if (referredByInput && referredByInput.trim()) {
        profileData.referredBy = referredByInput.trim();
      }

      // Log the profile data being sent
      console.log('Sending profile data to Firestore:', profileData);

      // Clear registration flags
      try {
        await AsyncStorage.removeItem('isRegistering');
        await AsyncStorage.removeItem('navigatingToPasswordCreation');
        console.log('Cleared registration flags');
      } catch (flagError) {
        console.error('Error clearing registration flags:', flagError);
      }

      // Use the setupProfile function from AuthContext
      const success = await setupProfile(profileData);

      if (!success) {
        setError('Failed to create profile. Please try again.');
      } else {
        console.log('Profile setup successful, completing registration flow');

        // Set authentication flags for successful registration completion
        await AsyncStorage.setItem('isAuthenticated', 'true');
        console.log('Set isAuthenticated flag in AsyncStorage');

        // Clear all registration flags
        await AsyncStorage.removeItem('isRegistering');
        await AsyncStorage.removeItem('currentRegistrationStep');
        console.log('Cleared registration flags');

        // CRITICAL FIX: Remove the block on main navigation now that registration is complete
        await AsyncStorage.removeItem('BLOCK_MAIN_NAVIGATION');
        console.log('Removed BLOCK_MAIN_NAVIGATION flag');

        // Set navigation flags to ensure proper navigation to Main screen
        await AsyncStorage.setItem('FORCE_NAVIGATE_TO_MAIN', 'true');
        await AsyncStorage.setItem('FORCE_NAVIGATE_TO_GROUPS', 'true');
        console.log('Set force navigation flags');

        // CRITICAL FIX: Use multiple navigation approaches for reliability
        console.log('CRITICAL FIX: Using multiple navigation approaches to Main');

        try {
          // First try simple navigation.navigate
          navigation.navigate('Main');
          console.log('Navigation to Main completed via navigate');
        } catch (navError) {
          console.error('Error using navigation.navigate:', navError);

          // Try to get the root navigation if possible
          try {
            const rootNavigation = navigation.getParent();
            if (rootNavigation) {
              rootNavigation.navigate('Main');
              console.log('Navigation to Main completed via root navigation');
            } else {
              throw new Error('Root navigation not available');
            }
          } catch (rootError) {
            console.error('Error using root navigation:', rootError);

            // Last resort: Use CommonActions
            try {
              const { CommonActions } = require('@react-navigation/native');
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    { name: 'Main' }
                  ]
                })
              );
              console.log('Navigation to Main completed via CommonActions');
            } catch (resetError) {
              console.error('All navigation attempts failed:', resetError);
            }
          }
        }
      }
    } catch (error) {
      setError('Failed to create profile. Please try again.');
      console.error('Error setting up profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use our custom permissions hook
  const { requestPermission } = usePermissions();

  // Directly handle image selection with minimal popups
  const handleSelectImage = async () => {
    // Create a simple action sheet with minimal UI
    const options = ['Take Photo', 'Choose from Gallery', 'Cancel'];
    const cancelButtonIndex = 2;

    // Use ActionSheetIOS on iOS for native feel
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            // Camera - directly request permission and launch camera
            const hasPermission = await requestPermission('camera', false); // false = no explanation popup
            if (hasPermission) {
              launchCamera(
                {
                  mediaType: 'photo',
                  includeBase64: false,
                  maxHeight: 500,
                  maxWidth: 500,
                  quality: 0.8,
                },
                handleImagePickerResponse
              );
            }
          } else if (buttonIndex === 1) {
            // Gallery - directly request permission and launch gallery
            const hasPermission = await requestPermission('photoLibrary', false); // false = no explanation popup
            if (hasPermission) {
              launchImageLibrary(
                {
                  mediaType: 'photo',
                  includeBase64: false,
                  maxHeight: 500,
                  maxWidth: 500,
                  quality: 0.8,
                  selectionLimit: 1,
                },
                handleImagePickerResponse
              );
            }
          }
        }
      );
    } else {
      // Use Alert on Android (could be replaced with a custom bottom sheet for better UX)
      Alert.alert(
        'Select Profile Picture',
        '',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Take Photo',
            onPress: async () => {
              const hasPermission = await requestPermission('camera', false); // false = no explanation popup
              if (hasPermission) {
                launchCamera(
                  {
                    mediaType: 'photo',
                    includeBase64: false,
                    maxHeight: 500,
                    maxWidth: 500,
                    quality: 0.8,
                  },
                  handleImagePickerResponse
                );
              }
            },
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const hasPermission = await requestPermission('photoLibrary', false); // false = no explanation popup
              if (hasPermission) {
                launchImageLibrary(
                  {
                    mediaType: 'photo',
                    includeBase64: false,
                    maxHeight: 500,
                    maxWidth: 500,
                    quality: 0.8,
                    selectionLimit: 1,
                  },
                  handleImagePickerResponse
                );
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Common handler for image picker response
  const handleImagePickerResponse = (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.error('ImagePicker Error:', response.errorMessage);
      // Silently handle errors without showing alerts
    } else if (response.assets && response.assets.length > 0) {
      setProfileImage(response.assets[0].uri);
    }
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>

        <Animated.View
          entering={FadeInUp.duration(800).delay(200)}
          style={styles.header}
        >
          <Text style={[styles.title, { color: themeColors.text }]}>Complete Your Profile</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Set up your profile to get started with CostSync
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(800).delay(400)}
          style={styles.form}
        >
          {error ? (
            <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleSelectImage}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: themeColors.primary.light + '30' }]}>
                <Icon name="camera-outline" size={32} color={themeColors.primary.default} />
              </View>
            )}
            <View style={[styles.addImageButton, { backgroundColor: themeColors.primary.default }]}>
              <Icon name="add" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={themeColors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>Username (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }
              ]}
              placeholder="Choose a username"
              placeholderTextColor={themeColors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.phoneContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>Phone Number</Text>
            <View style={[
              styles.phoneDisplay,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border
              }
            ]}>
              <Text style={[styles.phoneText, { color: themeColors.textSecondary }]}>
                {phoneNumber}
              </Text>
            </View>
          </View>

          {/* Referral Information */}
          <View style={styles.referralSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Referral Information (Optional)
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themeColors.text }]}>Referral Code</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }
                ]}
                placeholder="Enter referral code (if any)"
                placeholderTextColor={themeColors.textSecondary}
                value={referralCodeInput}
                onChangeText={setReferralCodeInput}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: themeColors.text }]}>Referred By</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }
                ]}
                placeholder="Enter name of person who referred you"
                placeholderTextColor={themeColors.textSecondary}
                value={referredByInput}
                onChangeText={setReferredByInput}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: name.trim()
                  ? themeColors.primary.default
                  : themeColors.primary.default + '80'
              }
            ]}
            onPress={handleProfileSetup}
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Complete Profile</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>
            You can always update your profile later
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSizes.base,
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: spacing.xxl,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    fontSize: fontSizes.base,
  },
  phoneContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  phoneDisplay: {
    width: '100%',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  phoneText: {
    fontSize: fontSizes.base,
  },
  button: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  skipText: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
    width: '100%',
  },
  referralSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '500',
    marginBottom: spacing.lg,
    width: '100%',
  },
});

export default ProfileSetupScreen;
