import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { extractCountryCodeAndNumber } from '../../utils/phoneUtils';
import {
  setRegistrationState,
  REGISTRATION_STATES,
  forceNavigationToScreen
} from '../../utils/registrationNavigation';

const PasswordCreationScreen = ({ navigation, route }) => {
  const { phoneNumber, fromOTPVerification = false, forceNewUser = false, emergency = false, superEmergency = false } = route.params;
  const { colors: themeColors } = useTheme();
  const { updateProfile, userProfile, login } = useAuth();

  console.log('PasswordCreationScreen loaded with params:', route.params);
  console.log('fromOTPVerification flag:', fromOTPVerification);
  console.log('forceNewUser flag:', forceNewUser);
  console.log('emergency flag:', emergency);
  console.log('superEmergency flag:', superEmergency);

  // SUPER EMERGENCY FIX: Log the navigation state
  console.log('Current navigation state:', navigation.getState());

  // Removed navigation success alert

  // Check for force navigation flag from OTP verification screen
  useEffect(() => {
    const checkForceNavigation = async () => {
      try {
        // Check for the new navigation flag
        const navigateToPasswordCreation = await AsyncStorage.getItem('NAVIGATE_TO_PASSWORD_CREATION');
        if (navigateToPasswordCreation === 'true') {
          console.log('NAVIGATE_TO_PASSWORD_CREATION flag detected in PasswordCreationScreen');

          // Get the phone number if it was stored
          const storedPhoneNumber = await AsyncStorage.getItem('PASSWORD_CREATION_PHONE');
          if (storedPhoneNumber && !phoneNumber) {
            console.log('Using stored phone number from navigation flag:', storedPhoneNumber);
            // We could update the route params here if needed
          }

          // Clear the flags
          await AsyncStorage.removeItem('NAVIGATE_TO_PASSWORD_CREATION');
          await AsyncStorage.removeItem('PASSWORD_CREATION_PHONE');
        }

        // Also check the old force navigation flag for backward compatibility
        const forceNavigate = await AsyncStorage.getItem('FORCE_NAVIGATE_TO_PASSWORD_CREATION');
        if (forceNavigate === 'true') {
          console.log('FORCE_NAVIGATE_TO_PASSWORD_CREATION flag detected in PasswordCreationScreen');

          // Get the phone number if it was stored
          const storedPhoneNumber = await AsyncStorage.getItem('FORCE_NAVIGATE_PHONE_NUMBER');
          if (storedPhoneNumber && !phoneNumber) {
            console.log('Using stored phone number from force navigation:', storedPhoneNumber);
            // We could update the route params here if needed
          }

          // Clear the flags
          await AsyncStorage.removeItem('FORCE_NAVIGATE_TO_PASSWORD_CREATION');
          await AsyncStorage.removeItem('FORCE_NAVIGATE_PHONE_NUMBER');
        }

        // Check for emergency navigation flag
        const emergencyNavigate = await AsyncStorage.getItem('EMERGENCY_NAVIGATE_TO');
        if (emergencyNavigate === 'PasswordCreationScreen') {
          console.log('EMERGENCY_NAVIGATE_TO flag detected in PasswordCreationScreen');

          // Get the params if they were stored
          const paramsString = await AsyncStorage.getItem('EMERGENCY_NAVIGATE_PARAMS');
          if (paramsString) {
            try {
              const params = JSON.parse(paramsString);
              console.log('Using stored params from emergency navigation:', params);
              // We could update the route params here if needed
            } catch (parseError) {
              console.error('Error parsing emergency navigation params:', parseError);
            }
          }

          // Clear the flags
          await AsyncStorage.removeItem('EMERGENCY_NAVIGATE_TO');
          await AsyncStorage.removeItem('EMERGENCY_NAVIGATE_PARAMS');
        }
      } catch (error) {
        console.error('Error checking navigation flags:', error);
      }
    };

    checkForceNavigation();
  }, []);

  // Check if we have a valid user profile and if we're in the middle of navigation
  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        console.log('Checking user profile in PasswordCreationScreen');
        console.log('Current userProfile from AuthContext:', userProfile);
        console.log('Current route params:', route.params);

        // Check if we're in the middle of navigation from OTP verification
        const navigatingFromOTP = await AsyncStorage.getItem('navigatingToPasswordCreation');
        console.log('navigatingFromOTP flag:', navigatingFromOTP);

        // Check if we're in the middle of registration
        const isRegistering = await AsyncStorage.getItem('isRegistering');
        console.log('isRegistering flag:', isRegistering);

        // Make sure we're in registration mode
        if (isRegistering !== 'true') {
          await AsyncStorage.setItem('isRegistering', 'true');
          console.log('Set isRegistering flag in AsyncStorage');
        }

        // Make sure isAuthenticated is false during registration
        await AsyncStorage.removeItem('isAuthenticated');
        console.log('Removed isAuthenticated flag from AsyncStorage');

        if (navigatingFromOTP === 'true') {
          // Don't clear the flag yet - we'll clear it after successful password creation
          console.log('Keeping navigatingToPasswordCreation flag until password creation is complete');
        } else {
          // If we're not navigating from OTP, set the flag to ensure proper flow
          await AsyncStorage.setItem('navigatingToPasswordCreation', 'true');
          console.log('Set navigatingToPasswordCreation flag in AsyncStorage');
        }

        // Update the current registration step
        await AsyncStorage.setItem('currentRegistrationStep', 'PasswordCreation');
        console.log('Set currentRegistrationStep to PasswordCreation');

        // Try to get the user profile from AsyncStorage
        const storedProfile = await AsyncStorage.getItem('userProfile');
        console.log('User profile from AsyncStorage:', storedProfile ? JSON.parse(storedProfile) : null);

        if (!userProfile && storedProfile) {
          // If we have a profile in AsyncStorage but not in context, log it
          const parsedProfile = JSON.parse(storedProfile);
          console.log('Found user profile in AsyncStorage:', parsedProfile);

          // We can't directly set userProfile since setUserProfile is not available
          // We'll use the profile from AsyncStorage for our operations
          console.log('Will use this profile for password creation');
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      }
    };

    checkUserProfile();
  }, []);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const validatePasswords = () => {
    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordMatchError(true);
      return false;
    }

    setPasswordMatchError(false);
    return true;
  };

  const handleCreatePassword = async () => {
    console.log('=== PASSWORD CREATION START ===');
    console.log('Current route params:', route.params);
    console.log('Current userProfile:', userProfile);

    navigation.navigate('ProfileSetup', {
            phoneNumber: phoneNumber,
            fromPasswordCreation: true
          });

    // setError('');
    // setPasswordMatchError(false);

    // if (!password.trim()) {
    //   setError('Please enter a password');
    //   return;
    // }

    // if (!confirmPassword.trim()) {
    //   setError('Please confirm your password');
    //   return;
    // }

    // if (!validatePasswords()) {
    //   return;
    // }

    // setLoading(true);

    // try {
    //   console.log('Creating password for phone number:', phoneNumber);

    //   // Extract the phone number without country code
    //   const { countryCode, phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNumber);
    //   console.log('Extracted phone details:', { countryCode, phoneNumberOnly });

    //   // Try to get the user profile from AsyncStorage
    //   const userProfileData = await AsyncStorage.getItem('userProfile');
    //   const storedProfile = userProfileData ? JSON.parse(userProfileData) : null;
    //   console.log('User profile from AsyncStorage:', storedProfile);

    //   // Create a new user profile if none exists
    //   if (!storedProfile) {
    //     console.log('No user profile found in AsyncStorage, creating a new one');

    //     // Create a basic user profile
    //     const newProfile = {
    //       id: phoneNumberOnly,
    //       phoneNumber: phoneNumberOnly,
    //       countryCode: countryCode,
    //       password: password,
    //       createdAt: new Date().toISOString(),
    //       updatedAt: new Date().toISOString()
    //     };



    //     console.log('Saving new user profile:', newProfile);

    //     // Save to AsyncStorage
    //     await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));

    //     // Update the AuthContext
    //     await login(newProfile);

    //     // Keep registration flags consistent
    //     console.log('Setting registration flags for ProfileSetup navigation');
    //     await AsyncStorage.setItem('isRegistering', 'true');
    //     await AsyncStorage.removeItem('isAuthenticated');
    //     await AsyncStorage.setItem('currentRegistrationStep', 'ProfileSetup');

    //     // Clear the navigatingToPasswordCreation flag since we're done with this step
    //     await AsyncStorage.removeItem('navigatingToPasswordCreation');

    //     // CRITICAL FIX: Keep blocking main navigation until profile setup is complete
    //     await AsyncStorage.setItem('BLOCK_MAIN_NAVIGATION', 'true');

    //     console.log('CRITICAL FIX: Using simpler navigation to ProfileSetup');

    //     try {
    //       // First try simple navigation.navigate
    //       navigation.navigate('ProfileSetup', {
    //         phoneNumber: phoneNumber,
    //         fromPasswordCreation: true
    //       });
    //       console.log('Navigation to ProfileSetup completed via navigate');
    //     } catch (navError) {
    //       console.error('Error using navigation.navigate:', navError);

    //       // Fallback to navigation.replace
    //       try {
    //         navigation.replace('ProfileSetup', {
    //           phoneNumber: phoneNumber,
    //           fromPasswordCreation: true
    //         });
    //         console.log('Navigation to ProfileSetup completed via replace');
    //       } catch (replaceError) {
    //         console.error('Error using navigation.replace:', replaceError);

    //         // Last resort: Use CommonActions
    //         try {
    //           const { CommonActions } = require('@react-navigation/native');
    //           navigation.dispatch(
    //             CommonActions.reset({
    //               index: 0,
    //               routes: [
    //                 {
    //                   name: 'ProfileSetup',
    //                   params: {
    //                     phoneNumber: phoneNumber,
    //                     fromPasswordCreation: true
    //                   }
    //                 }
    //               ]
    //             })
    //           );
    //           console.log('Navigation to ProfileSetup completed via CommonActions');
    //         } catch (resetError) {
    //           console.error('All navigation attempts failed:', resetError);
    //         }
    //       }
    //     }

    //     return;
    //   }

    //   // If we have a stored profile, update it
    //   console.log('Updating existing user profile');

    //   // Create update object with password and referral info if provided
    //   const updateData = {
    //     password: password,
    //     // Store the password as the current password for future verification
    //     // This ensures the password created during registration is used for verification in settings
    //     currentPassword: password
    //   };

    //   console.log('Updating profile with data:', updateData);

    //   // Update the user profile
    //   const success = await updateProfile(updateData);
    //   console.log('Update profile result:', success);

    //   if (success) {
    //     console.log('Password updated successfully, navigating to ProfileSetup');

    //     // Keep registration flags consistent
    //     await AsyncStorage.setItem('isRegistering', 'true');
    //     await AsyncStorage.removeItem('isAuthenticated');
    //     await AsyncStorage.setItem('currentRegistrationStep', 'ProfileSetup');

    //     // Clear the navigatingToPasswordCreation flag since we're done with this step
    //     await AsyncStorage.removeItem('navigatingToPasswordCreation');

    //     // CRITICAL FIX: Keep blocking main navigation until profile setup is complete
    //     await AsyncStorage.setItem('BLOCK_MAIN_NAVIGATION', 'true');

    //     console.log('CRITICAL FIX: Using simpler navigation to ProfileSetup');

    //     try {
    //       // First try simple navigation.navigate
    //       navigation.navigate('ProfileSetup', {
    //         phoneNumber: phoneNumber,
    //         fromPasswordCreation: true
    //       });
    //       console.log('Navigation to ProfileSetup completed via navigate');
    //     } catch (navError) {
    //       console.error('Error using navigation.navigate:', navError);

    //       // Fallback to navigation.replace
    //       try {
    //         navigation.replace('ProfileSetup', {
    //           phoneNumber: phoneNumber,
    //           fromPasswordCreation: true
    //         });
    //         console.log('Navigation to ProfileSetup completed via replace');
    //       } catch (replaceError) {
    //         console.error('Error using navigation.replace:', replaceError);

    //         // Last resort: Use CommonActions
    //         try {
    //           const { CommonActions } = require('@react-navigation/native');
    //           navigation.dispatch(
    //             CommonActions.reset({
    //               index: 0,
    //               routes: [
    //                 {
    //                   name: 'ProfileSetup',
    //                   params: {
    //                     phoneNumber: phoneNumber,
    //                     fromPasswordCreation: true
    //                   }
    //                 }
    //               ]
    //             })
    //           );
    //           console.log('Navigation to ProfileSetup completed via CommonActions');
    //         } catch (resetError) {
    //           console.error('All navigation attempts failed:', resetError);
    //         }
    //       }
    //     }
    //   } else {
    //     console.error('Failed to update profile - success is false');
    //     setError('Failed to create password. Please try again.');
    //   }
    // } catch (error) {
    //   console.error('Error creating password:', error);
    //   console.error('Error details:', error.message, error.stack);
    //   setError('Failed to create password. Please try again.');
    // } finally {
    //   console.log('=== PASSWORD CREATION END ===');
    //   setLoading(false);
    // }
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInUp.duration(800).delay(200)}
          style={styles.header}
        >
          <Image
            source={{ uri: 'https://img.freepik.com/free-vector/privacy-policy-concept-illustration_114360-7853.jpg' }}
            style={styles.headerImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: themeColors.text }]}>Create Password</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Set up a password for your account to login easily next time
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(800).delay(400)}
          style={styles.form}
        >
          {error ? (
            <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
          ) : null}

          <Text style={[styles.phoneDisplay, { color: themeColors.text }]}>
            Phone: {phoneNumber}
          </Text>

          <Text style={[styles.label, { color: themeColors.text }]}>Password</Text>
          <View style={[styles.passwordContainer, {
            backgroundColor: themeColors.surface,
            borderColor: error && !password.trim() ? themeColors.danger : themeColors.border
          }]}>
            <TextInput
              style={[styles.passwordInput, { color: themeColors.text }]}
              placeholder="Create a password"
              placeholderTextColor={themeColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.visibilityToggle}>
              <Icon
                name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={themeColors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: themeColors.text }]}>Confirm Password</Text>
          <View style={[styles.passwordContainer, {
            backgroundColor: themeColors.surface,
            borderColor: passwordMatchError || (error && !confirmPassword.trim()) ? themeColors.danger : themeColors.border
          }]}>
            <TextInput
              style={[styles.passwordInput, { color: themeColors.text }]}
              placeholder="Confirm your password"
              placeholderTextColor={themeColors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!confirmPasswordVisible}
            />
            <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.visibilityToggle}>
              <Icon
                name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={themeColors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {passwordMatchError && (
            <Text style={[styles.matchErrorText, { color: themeColors.danger }]}>
              Password didn't match
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: password.trim() && confirmPassword.trim()
                  ? themeColors.primary.default
                  : `${themeColors.primary.default}80`
              }
            ]}
            onPress={handleCreatePassword}
            disabled={loading || !password.trim() || !confirmPassword.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Password</Text>
            )}
          </TouchableOpacity>

          {/* Removed "Go to login screen" button to prevent navigation back to login */}
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerImage: {
    width: '80%',
    height: 200,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.base,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
  },
  form: {
    width: '100%',
  },
  phoneDisplay: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    fontSize: fontSizes.base,
  },
  visibilityToggle: {
    paddingHorizontal: spacing.md,
  },
  matchErrorText: {
    fontSize: fontSizes.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  button: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  loginButton: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loginButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '500',
  },
  errorText: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

export default PasswordCreationScreen;
