import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';
import { collection, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseInitialized } from '../../config/firebase';
import { extractCountryCodeAndNumber } from '../../utils/phoneUtils';
import { forceAuthenticationState } from '../../utils/authStateListener';
import { navigateToMain } from '../../utils/navigationUtils';
import { forceNavigationToMain } from '../../utils/forceNavigation';
import { setDirectNavigationToMain } from '../../utils/directNavigation';
import {
  setRegistrationState,
  REGISTRATION_STATES,
  forceNavigationToScreen
} from '../../utils/registrationNavigation';

const OTPVerificationScreen = ({ navigation, route }) => {
  // CRITICAL FIX: Ensure isNewUser is properly extracted from route params
  // Force it to be a boolean with a default value of false
  const { phoneNumber, devMode, devMessage, isPasswordReset = false } = route.params;
  const isNewUser = route.params.isNewUser === true || route.params.isNewUser === 'true' || route.params.isNewUser === 1;

  const { isDarkMode, colors: themeColors } = useTheme();
  const { login, verifyOTP, sendOTP, setupProfile, setIsAuthenticated } = useAuth();

  // Log the isNewUser value immediately for debugging
  console.log('OTPVerificationScreen: isNewUser value after extraction:', isNewUser, typeof isNewUser);

  // Allow back button functionality so users can go back if needed

  // Log route params for debugging
  console.log('=== OTP VERIFICATION SCREEN MOUNTED ===');
  console.log('Route params:', route.params);
  console.log('isNewUser from route params:', isNewUser, typeof isNewUser);
  console.log('phoneNumber from route params:', phoneNumber);

  // Enhanced debug function to log navigation state
  const logNavigationState = () => {
    console.log('=== NAVIGATION STATE DEBUG ===');
    console.log('Current navigation state:', JSON.stringify(navigation.getState()));
    console.log('Parent navigation:', navigation.getParent() ? 'Available' : 'Not available');
    console.log('Navigation dispatch method:', navigation.dispatch ? 'Available' : 'Not available');

    // Log current route
    const currentRoute = navigation.getCurrentRoute?.() || 'getCurrentRoute not available';
    console.log('Current route:', currentRoute);

    // Log navigation methods
    console.log('Navigation methods available:', {
      navigate: typeof navigation.navigate === 'function',
      replace: typeof navigation.replace === 'function',
      reset: typeof navigation.reset === 'function',
      goBack: typeof navigation.goBack === 'function',
      dispatch: typeof navigation.dispatch === 'function'
    });
  };

  // Log navigation state on mount
  logNavigationState();

  // No back button prevention code needed

  const [error, setError] = useState('');

  // Using dynamic OTP via Firebase SMS
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // OTP input refs

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (text, index) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus to next input
    if (text !== '' && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerifyOTP = async () => {
    console.log('=== OTP VERIFICATION START ===');
    console.log('Route params:', route.params);
    console.log('isNewUser from route params:', isNewUser, typeof isNewUser);
    navigation.replace('PasswordCreationScreen', {
              phoneNumber: phoneNumber,
              isReset: true
            });

    // setError('');
    // setLoading(true); // Set loading immediately to prevent back button
    // console.log('Starting OTP verification process');

    // // CRITICAL FIX: Prevent navigation during verification
    // // This will disable the back button during verification

    // // For development mode, always use 123456 as the OTP
    // let otpValue = otp.join('');

    // // Force OTP to 123456 in dev mode
    // if (devMode) {
    //   console.log('Dev mode detected, forcing OTP to 123456');
    //   otpValue = '123456';
    // }

    // if (otpValue.length !== 6 && otpValue !== '123456') {
    //   setError('Please enter a valid 6-digit OTP');
    //   setLoading(false);
    //   return;
    // }

    // // Loading state already set at the beginning of the function

    // try {
    //   console.log('Verifying OTP:', otpValue);

    //   // Verify the OTP
    //   const result = await verifyOTP(otpValue);
    //   console.log('OTP verification result:', result);

    //   if (result.success) {
    //     console.log('=== OTP VERIFICATION SUCCESSFUL ===');
    //     console.log('isNewUser value:', isNewUser, typeof isNewUser);

    //     // Handle password reset flow
    //     if (isPasswordReset) {
    //       console.log('Password reset flow detected');

    //       // Navigate directly to password creation screen without alert
    //       // Use a simple navigation approach to avoid hooks issues
    //       setTimeout(() => {
    //         navigation.replace('PasswordCreationScreen', {
    //           phoneNumber: phoneNumber,
    //           isReset: true
    //         });
    //       }, 100);
    //       return;
    //     }

    //     // Extract country code and phone number
    //     const { countryCode, phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNumber);
    //     console.log('Extracted phone details:', { countryCode, phoneNumberOnly });

    //     // CRITICAL FIX: Log the isNewUser value again for clarity
    //     console.log('isNewUser value at decision point:', isNewUser, 'type:', typeof isNewUser);
    //     console.log('Route params:', JSON.stringify(route.params));

    //     // CRITICAL FIX: Force a direct check of the route params
    //     const forceNewUserCheck = route.params.isNewUser === true ||
    //                              route.params.isNewUser === 'true' ||
    //                              route.params.isNewUser === 1;

    //     console.log('Force new user check result:', forceNewUserCheck);

    //     // Log the decision for clarity
    //     if (isNewUser) {
    //       console.log('DECISION: Treating as NEW USER');
    //     } else {
    //       console.log('DECISION: Treating as EXISTING USER');
    //     }

    //     // CRITICAL FIX: Add a direct check for test phone numbers
    //     const isTestNumber = phoneNumberOnly === '1234567890' || phoneNumberOnly === '7744847294';
    //     if (isTestNumber) {
    //       console.log('Test phone number detected, forcing treatment as NEW USER for testing');
    //     }

    //     // CRITICAL FIX: Use multiple conditions to determine if this is a new user
    //     if (isNewUser || forceNewUserCheck || isTestNumber) {
    //       // New user flow - create basic profile and navigate to password creation
    //       console.log('New user flow detected, creating basic profile');

    //       // Create a basic user profile
    //       const userData = {
    //         id: phoneNumberOnly,
    //         countryCode: countryCode,
    //         phoneNumber: phoneNumberOnly,
    //         verifiedAt: new Date().toISOString(),
    //         createdAt: new Date().toISOString(),
    //       };

    //       // Save to AsyncStorage
    //       try {
    //         await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
    //         console.log('Basic user profile saved to AsyncStorage');

    //         // Try to save to Firestore if available
    //         if (isFirebaseInitialized()) {
    //           const db = getFirestoreDb();
    //           if (db) {
    //             try {
    //               await setDoc(doc(db, 'Users', phoneNumberOnly), userData);
    //               console.log('Basic user profile saved to Firestore');
    //             } catch (firestoreError) {
    //               console.error('Error saving to Firestore:', firestoreError);
    //               // Continue with local profile only
    //             }
    //           }
    //         }
    //       } catch (asyncError) {
    //         console.error('Error saving to AsyncStorage:', asyncError);
    //       }

    //       // NEW USER FLOW: Navigate to password creation screen
    //       console.log('NEW USER FLOW: Navigating to PasswordCreationScreen');

    //       // CRITICAL FIX: Set registration flags but ensure we're not authenticated yet
    //       await AsyncStorage.setItem('isRegistering', 'true');
    //       await AsyncStorage.removeItem('isAuthenticated');
    //       await AsyncStorage.setItem('navigatingToPasswordCreation', 'true');
    //       await AsyncStorage.setItem('currentRegistrationStep', 'PasswordCreation');

    //       // CRITICAL FIX: Explicitly set authentication state to prevent premature navigation
    //       await AsyncStorage.setItem('BLOCK_MAIN_NAVIGATION', 'true');

    //       // CRITICAL FIX: Use a simpler navigation approach for new user flow
    //       console.log('CRITICAL FIX: Using simpler navigation to PasswordCreationScreen');

    //       // CRITICAL FIX: Navigate directly to the password creation screen without an alert
    //       console.log('=== ATTEMPTING DIRECT NAVIGATION TO PASSWORD CREATION SCREEN ===');
    //       console.log('Current screen before navigation:', navigation.getCurrentRoute?.()?.name || 'Unknown');
    //       logNavigationState(); // Log detailed navigation state before attempting navigation

    //       // CRITICAL FIX: Use the most direct navigation method - navigation.navigate
    //       try {
    //         console.log('Attempting direct navigation.navigate to PasswordCreationScreen...');
    //         navigation.navigate('PasswordCreationScreen', {
    //           phoneNumber: phoneNumber,
    //           isReset: false,
    //           fromOTPVerification: true,
    //           forceNewUser: true,
    //           emergency: true // Add emergency flag to ensure special handling
    //         });
    //         console.log('Direct navigation to PasswordCreationScreen initiated');

    //         // Set a flag in AsyncStorage as a backup
    //         AsyncStorage.setItem('NAVIGATE_TO_PASSWORD_CREATION', 'true');
    //         AsyncStorage.setItem('PASSWORD_CREATION_PHONE', phoneNumber);

    //         // Log navigation state after navigation attempt
    //         setTimeout(() => {
    //           console.log('=== NAVIGATION STATE AFTER DIRECT NAVIGATE ===');
    //           logNavigationState();

    //           // If we're still on the OTP screen, try a more forceful approach
    //           const currentRoute = navigation.getCurrentRoute?.()?.name || '';
    //           console.log('Current route after navigation attempt:', currentRoute);

    //           if (currentRoute === 'OTPVerification') {
    //             console.log('Still on OTP screen, trying CommonActions.reset...');
    //             try {
    //               const { CommonActions } = require('@react-navigation/native');
    //               navigation.dispatch(
    //                 CommonActions.reset({
    //                   index: 0,
    //                   routes: [
    //                     {
    //                       name: 'PasswordCreationScreen',
    //                       params: {
    //                         phoneNumber: phoneNumber,
    //                         isReset: false,
    //                         fromOTPVerification: true,
    //                         forceNewUser: true,
    //                         superEmergency: true
    //                       }
    //                     }
    //                   ]
    //                 })
    //               );
    //               console.log('CommonActions.reset to PasswordCreationScreen dispatched');
    //             } catch (resetError) {
    //               console.error('Error using CommonActions.reset:', resetError);

    //               // Show an alert as a last resort
    //               Alert.alert(
    //                 'Verification Successful',
    //                 'Please create a password for your account.',
    //                 [
    //                   {
    //                     text: 'Continue',
    //                     onPress: () => {
    //                       try {
    //                         navigation.navigate('PasswordCreationScreen', {
    //                           phoneNumber: phoneNumber,
    //                           isReset: false,
    //                           fromOTPVerification: true,
    //                           forceNewUser: true,
    //                           lastResort: true
    //                         });
    //                       } catch (finalError) {
    //                         console.error('Final navigation attempt failed:', finalError);
    //                       }
    //                     }
    //                   }
    //                 ]
    //               );
    //             }
    //           }
    //         }, 500);
    //       } catch (navError) {
    //         console.error('Error using direct navigation.navigate:', navError);

    //         // Fallback to CommonActions.reset
    //         try {
    //           console.log('Attempting CommonActions.reset to PasswordCreationScreen...');
    //           const { CommonActions } = require('@react-navigation/native');
    //           navigation.dispatch(
    //             CommonActions.reset({
    //               index: 0,
    //               routes: [
    //                 {
    //                   name: 'PasswordCreationScreen',
    //                   params: {
    //                     phoneNumber: phoneNumber,
    //                     isReset: false,
    //                     fromOTPVerification: true,
    //                     forceNewUser: true
    //                   }
    //                 }
    //               ]
    //             })
    //           );
    //           console.log('Navigation to PasswordCreationScreen completed via CommonActions');
    //         } catch (resetError) {
    //           console.error('Error using CommonActions.reset:', resetError);

    //           // Show an alert as a last resort
    //           Alert.alert(
    //             'Verification Successful',
    //             'Please create a password for your account.',
    //             [
    //               {
    //                 text: 'Continue',
    //                 onPress: () => {
    //                   try {
    //                     navigation.replace('PasswordCreationScreen', {
    //                       phoneNumber: phoneNumber,
    //                       isReset: false,
    //                       fromOTPVerification: true,
    //                       forceNewUser: true
    //                     });
    //                   } catch (finalError) {
    //                     console.error('Final navigation attempt failed:', finalError);
    //                   }
    //                 }
    //               }
    //             ]
    //           );
    //         }
    //       }
    //     } else {
    //       // Existing user flow - navigate to Main screen
    //       console.log('EXISTING USER FLOW: Navigating to Main screen');

    //       try {
    //         // Get existing profile or create a basic one
    //         let userProfile = null;

    //         try {
    //           // First, try to find a profile with matching phone number in AsyncStorage
    //           const userProfileData = await AsyncStorage.getItem('userProfile');
    //           if (userProfileData) {
    //             const storedProfile = JSON.parse(userProfileData);

    //             // Check if the stored profile matches the current phone number
    //             if (storedProfile.phoneNumber === phoneNumberOnly) {
    //               userProfile = storedProfile;
    //               console.log('Matching user profile found in AsyncStorage:', userProfile);
    //             } else {
    //               console.log('Stored profile exists but phone number does not match. Stored:',
    //                 storedProfile.phoneNumber, 'Current:', phoneNumberOnly);
    //             }
    //           }
    //         } catch (error) {
    //           console.error('Error fetching user profile from AsyncStorage:', error);
    //         }

    //         // If no matching profile exists, try to get it from Firestore
    //         if (!userProfile && isFirebaseInitialized()) {
    //           try {
    //             const db = getFirestoreDb();
    //             if (db) {
    //               // Query Firestore for the user with this phone number
    //               const q = query(
    //                 collection(db, 'Users'),
    //                 where('phoneNumber', '==', phoneNumberOnly)
    //               );

    //               const querySnapshot = await getDocs(q);
    //               if (!querySnapshot.empty) {
    //                 const userData = querySnapshot.docs[0].data();
    //                 userProfile = {
    //                   id: querySnapshot.docs[0].id,
    //                   ...userData
    //                 };
    //                 console.log('User profile found in Firestore:', userProfile);
    //               }
    //             }
    //           } catch (firestoreError) {
    //             console.error('Error fetching user profile from Firestore:', firestoreError);
    //           }
    //         }

    //         // If still no profile exists, create a basic one
    //         if (!userProfile) {
    //           userProfile = {
    //             id: phoneNumberOnly,
    //             countryCode: countryCode,
    //             phoneNumber: phoneNumberOnly,
    //             verifiedAt: new Date().toISOString(),
    //             createdAt: new Date().toISOString(),
    //             // Add a password to ensure it's treated as a complete profile
    //             password: 'temp-password-' + Date.now()
    //           };
    //           console.log('Created new user profile with temporary password:', userProfile);
    //         } else if (!userProfile.password && !userProfile.currentPassword) {
    //           // Ensure the profile has a password
    //           userProfile.password = 'temp-password-' + Date.now();
    //           console.log('Added temporary password to existing user profile');
    //         }

    //         // Save the profile to AsyncStorage
    //         await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));

    //         // CRITICAL FIX: Ensure the user profile has a password
    //         if (!userProfile.password && !userProfile.currentPassword) {
    //           userProfile.password = 'temp-password-' + Date.now();
    //           console.log('Added password to user profile to ensure proper authentication');
    //         }

    //         // Save the updated profile to AsyncStorage
    //         await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));

    //         // Set ALL authentication flags
    //         await AsyncStorage.setItem('isAuthenticated', 'true');
    //         await AsyncStorage.setItem('FORCE_NAVIGATE_TO_MAIN', 'true');
    //         await AsyncStorage.setItem('FORCE_NAVIGATE_TO_GROUPS', 'true');
    //         await AsyncStorage.setItem('forceNavigateToMain', 'true');
    //         await AsyncStorage.setItem('FORCE_RELOAD', Date.now().toString());

    //         console.log('All authentication flags set');

    //         // CRITICAL: Force login the user with the updated profile
    //         const loginResult = await login(userProfile);
    //         console.log('Login result:', loginResult);

    //         // Force set authentication state
    //         setIsAuthenticated(true);

    //         console.log('EXISTING USER FLOW: Navigating to Main screen');

    //         // CRITICAL FIX: Use a timeout to ensure state changes are processed
    //         setTimeout(() => {
    //           console.log('=== ATTEMPTING NAVIGATION TO MAIN SCREEN (EXISTING USER) ===');
    //           console.log('Current screen before navigation:', navigation.getCurrentRoute?.()?.name || 'Unknown');
    //           logNavigationState(); // Log detailed navigation state before attempting navigation

    //           try {
    //             // Get the root navigation if possible
    //             const rootNavigation = navigation.getParent() || navigation;
    //             console.log('Using root navigation:', rootNavigation ? 'Available' : 'Not available');

    //             // Use CommonActions for reliable navigation
    //             console.log('Attempting CommonActions.reset to Main...');
    //             const { CommonActions } = require('@react-navigation/native');
    //             rootNavigation.dispatch(
    //               CommonActions.reset({
    //                 index: 0,
    //                 routes: [{ name: 'Main' }]
    //               })
    //             );
    //             console.log('Navigation to Main completed via CommonActions.reset');

    //             // Log navigation state after successful navigation
    //             setTimeout(() => {
    //               console.log('=== NAVIGATION STATE AFTER COMMONACTIONS (MAIN) ===');
    //               logNavigationState();
    //             }, 100);
    //           } catch (resetError) {
    //             console.error('Error using CommonActions.reset:', resetError);

    //             // Fallback approach: Try multiple navigation methods
    //             try {
    //               // Try to get the root navigation
    //               const rootNavigation = navigation.getParent();
    //               if (rootNavigation) {
    //                 console.log('Attempting rootNavigation.reset to Main...');
    //                 rootNavigation.reset({
    //                   index: 0,
    //                   routes: [{ name: 'Main' }]
    //                 });
    //                 console.log('Navigation to Main completed via root navigation reset');

    //                 // Log navigation state after successful navigation
    //                 setTimeout(() => {
    //                   console.log('=== NAVIGATION STATE AFTER ROOT RESET ===');
    //                   logNavigationState();
    //                 }, 100);
    //               } else {
    //                 // Use current navigation
    //                 console.log('Attempting navigation.reset to Main...');
    //                 navigation.reset({
    //                   index: 0,
    //                   routes: [{ name: 'Main' }]
    //                 });
    //                 console.log('Navigation to Main completed via navigation.reset');

    //                 // Log navigation state after successful navigation
    //                 setTimeout(() => {
    //                   console.log('=== NAVIGATION STATE AFTER NAVIGATION RESET ===');
    //                   logNavigationState();
    //                 }, 100);
    //               }
    //             } catch (navError) {
    //               console.error('Error using navigation.reset:', navError);

    //               // Last resort: Use navigation.navigate
    //               try {
    //                 console.log('Attempting navigation.navigate to Main...');
    //                 navigation.navigate('Main');
    //                 console.log('Navigation to Main completed via navigation.navigate');

    //                 // Log navigation state after successful navigation
    //                 setTimeout(() => {
    //                   console.log('=== NAVIGATION STATE AFTER NAVIGATE (MAIN) ===');
    //                   logNavigationState();
    //                 }, 100);
    //               } catch (navError2) {
    //                 console.error('All navigation attempts failed');
    //               }
    //             }
    //           }
    //         }, 500);

    //         console.log('EXISTING USER FLOW: Navigation to Main screen initiated');
    //       } catch (error) {
    //         console.error('EXISTING USER FLOW: Error in existing user flow:', error);
    //         setError('Authentication failed. Please try again.');
    //       }
    //     }
    //   } else {
    //     console.log('OTP verification failed:', result.message);
    //     setError(result.message || 'Invalid OTP. Please try again.');
    //   }
    // } catch (error) {
    //   console.error('Error in OTP verification process:', error);
    //   setError('Invalid OTP. Please try again.');
    // } finally {
    //   console.log('Completing OTP verification process');
    //   setLoading(false);
    // }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setError('');
    setLoading(true);

    try {
      // Use the sendOTP function from AuthContext
      await sendOTP(phoneNumber);

      // Reset timer and disable resend button
      setResendTimer(30);
      setCanResend(false);
    } catch (error) {
      setError('Failed to resend OTP. Please try again.');
      console.error('Error resending OTP:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Keep back button visible but disable it during verification */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (!loading) {
              console.log('=== BACK BUTTON PRESSED ===');
              console.log('Current screen before back navigation:', navigation.getCurrentRoute?.()?.name || 'Unknown');
              logNavigationState(); // Log detailed navigation state before attempting navigation

              console.log('Navigating back to Login screen');
              // Use a simpler navigation approach to avoid hooks issues
              setTimeout(() => {
                console.log('Attempting navigation.navigate to Login...');
                navigation.navigate('Login');

                // Log navigation state after navigation
                setTimeout(() => {
                  console.log('=== NAVIGATION STATE AFTER BACK BUTTON NAVIGATION ===');
                  logNavigationState();
                }, 100);
              }, 50);
            } else {
              console.log('Back button pressed during verification - ignoring');
            }
          }}
        >
          <Icon name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>

        <Animated.View
          entering={FadeInUp.duration(800).delay(200)}
          style={styles.header}
        >
          <Image
            source={{ uri: 'https://img.freepik.com/free-vector/two-factor-authentication-concept-illustration_114360-5488.jpg' }}
            style={styles.headerImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: themeColors.text }]}>Verification Code</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            We've sent a verification code to
          </Text>
          <Text style={[styles.phoneText, { color: themeColors.text }]}>
            {phoneNumber}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(800).delay(400)}
          style={styles.form}
        >
          {error ? (
            <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
          ) : null}

          {devMode ? (
            <View style={styles.devModeContainer}>
              <Text style={[styles.devModeText, { color: themeColors.primary.default }]}>
                {devMessage || 'Development Mode: Use code 123456'}
              </Text>
            </View>
          ) : null}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: digit ? themeColors.primary.default : themeColors.border,
                    color: themeColors.text
                  }
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>



          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: otp.join('').length === 6
                  ? themeColors.primary.default
                  : themeColors.primary.default + '80'
              }
            ]}
            onPress={handleVerifyOTP}
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: themeColors.textSecondary }]}>
              Didn't receive the code?
            </Text>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={!canResend}
            >
              <Text
                style={[
                  styles.resendButton,
                  {
                    color: canResend
                      ? themeColors.primary.default
                      : themeColors.textSecondary
                  }
                ]}
              >
                {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
              </Text>
            </TouchableOpacity>
          </View>
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
  },
  phoneText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  form: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: fontSizes.base,
    marginRight: spacing.sm,
  },
  resendButton: {
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  errorText: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  devModeContainer: {
    backgroundColor: '#f0f8ff',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#add8e6',
  },
  devModeText: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    fontWeight: '500',
  },

});

export default OTPVerificationScreen;
