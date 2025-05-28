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
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import CountryCodePicker from '../../components/common/CountryCodePicker';
import { countryCodes, formatPhoneNumber, validatePhoneNumber } from '../../utils/countryCodesData';
import UserService from '../../services/UserService';
import { extractCountryCodeAndNumber } from '../../utils/phoneUtils';
import { useFocusEffect } from '@react-navigation/native';
// We don't need to import navigateToOTPVerification directly as it's used through the components
import showExistingUserAlert from '../../components/auth/ExistingUserAlert';
import handleNewUserOTP from '../../components/auth/OTPHandler';

// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');


const PhoneLoginScreen = ({ navigation, route }) => {
  const { colors: themeColors } = useTheme();
  const { sendOTP, isAuthenticated, setIsAuthenticated } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState(countryCodes.find(c => c.code === "+91") || countryCodes[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Check if we need to navigate to Main (from route params)
  useEffect(() => {
    const navigateToMain = route.params?.navigateToMain;
    console.log('PhoneLoginScreen mounted, navigateToMain:', navigateToMain);

    if (navigateToMain) {
      console.log('SUPER DIRECT APPROACH: navigateToMain flag detected, forcing navigation to Main');

      // Set authentication flags
      const setAuthFlags = async () => {
        try {
          await AsyncStorage.setItem('isAuthenticated', 'true');
          await AsyncStorage.setItem('FORCE_NAVIGATE_TO_MAIN', 'true');
          await AsyncStorage.setItem('FORCE_NAVIGATE_TO_GROUPS', 'true');
          await AsyncStorage.setItem('FORCE_RELOAD', Date.now().toString());

          console.log('SUPER DIRECT APPROACH: Authentication flags set');

          // Force authentication state in memory
          setIsAuthenticated(true);

          // Use setTimeout to ensure this happens after the component is fully mounted
          setTimeout(() => {
            try {
              // Try multiple navigation approaches

              // Approach 1: Use CommonActions.reset
              try {
                const { CommonActions } = require('@react-navigation/native');
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Main' }]
                  })
                );
                console.log('SUPER DIRECT APPROACH: CommonActions.reset successful');
              } catch (resetError) {
                console.error('SUPER DIRECT APPROACH: CommonActions.reset failed:', resetError);

                // Approach 2: Use navigation.reset
                try {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }]
                  });
                  console.log('SUPER DIRECT APPROACH: navigation.reset successful');
                } catch (navError) {
                  console.error('SUPER DIRECT APPROACH: navigation.reset failed:', navError);

                  // Approach 3: Use navigation.navigate
                  navigation.navigate('Main');
                }
              }
            } catch (error) {
              console.error('SUPER DIRECT APPROACH: All navigation attempts failed:', error);
            }
          }, 500);
        } catch (error) {
          console.error('SUPER DIRECT APPROACH: Error setting auth flags:', error);
        }
      };

      setAuthFlags();
    }
  }, [route.params, navigation, setIsAuthenticated]);

  // Check authentication state when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('PhoneLoginScreen focused, checking authentication state');
      console.log('Current isAuthenticated state:', isAuthenticated);

      // Disabled automatic navigation to Main screen
      // This allows users to stay on the Login screen after OTP verification
      if (isAuthenticated) {
        console.log('User is authenticated, but not navigating automatically');
      }
    }, [isAuthenticated, navigation])
  );

  // Additional effect to check authentication state on mount and when it changes
  useEffect(() => {
    console.log('PhoneLoginScreen: Authentication state changed, isAuthenticated =', isAuthenticated);

    // Disabled automatic navigation to Main screen
    // This allows users to stay on the Login screen after OTP verification
    if (isAuthenticated) {
      console.log('User is authenticated (from useEffect), but not navigating automatically');
    }
  }, [isAuthenticated, navigation]);



  // Handle phone number input and formatting
  const handlePhoneNumberChange = (text) => {
    // Remove any non-digit characters from the input
    const digitsOnly = text.replace(/\D/g, '');
    setPhoneNumber(digitsOnly);

    // Format the phone number according to the selected country's format
    const formatted = formatPhoneNumber(digitsOnly, selectedCountry.code);
    setFormattedPhoneNumber(formatted);

    // Validate the phone number
    const isValidNumber = validatePhoneNumber(formatted, selectedCountry.code);
    setIsValid(isValidNumber);

    // Clear any previous errors when the user types
    if (error) setError('');

    // For testing: If the user enters 1234567890, set it as valid
    if (digitsOnly === '1234567890') {
      setIsValid(true);
    }
  };

  // Handle country selection
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);

    // Re-format the phone number according to the new country format
    const formatted = formatPhoneNumber(phoneNumber, country.code);
    setFormattedPhoneNumber(formatted);

    // Re-validate with the new country code
    const isValidNumber = validatePhoneNumber(formatted, country.code);
    setIsValid(isValidNumber);
  };

  const handleSendOTP = async () => {
    console.log('=== PHONE LOGIN: SEND OTP START ===');
    setError('');

    if (!isValid) {
      setError(`Please enter a valid phone number in the format: ${selectedCountry.example}`);
      return;
    }

    // Prevent multiple submissions by checking if already loading
    if (loading) {
      console.log('Already processing a request, ignoring duplicate tap');
      return;
    }

    setLoading(true);

    try {
      // Get the full phone number with country code
      const fullPhoneNumber = selectedCountry.code + phoneNumber;
      console.log('Full phone number:', fullPhoneNumber);

      // Extract the phone number without country code
      const { countryCode, phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(fullPhoneNumber);
      console.log('Extracted country code:', countryCode, 'Phone number only:', phoneNumberOnly);

      // Check if the phone number is already registered in Firebase
      console.log('Checking if phone number exists in Firebase:', phoneNumberOnly);

      // Clear any existing user data from AsyncStorage for a clean start
      try {
        const existingProfile = await AsyncStorage.getItem('userProfile');
        if (existingProfile) {
          const profile = JSON.parse(existingProfile);
          if (profile.phoneNumber !== phoneNumberOnly) {
            console.log('Different phone number detected, clearing existing profile data');
            await AsyncStorage.removeItem('userProfile');
          }
        }
      } catch (storageError) {
        console.error('Error checking AsyncStorage:', storageError);
      }

      // For testing: If the phone number is 1234567890 or 7744847294, simulate an existing user
      let existingUser = null;
      if (phoneNumberOnly === '1234567890' || phoneNumberOnly === '7744847294') {
        console.log('Test phone number detected, simulating existing user');
        existingUser = {
          id: 'test-user-id',
          phoneNumber: phoneNumberOnly,
          name: 'Test User'
        };
      } else {
        existingUser = await UserService.getUserByPhoneNumber(phoneNumberOnly);
      }

      // Log the result of the existing user check
      console.log('Existing user check for', phoneNumberOnly, ':', existingUser ? 'User exists' : 'New user');
      console.log('Existing user check result:', existingUser);

      if (existingUser) {
        // Phone number is already registered, show alert with options
        console.log('Showing alert for existing user');
        setLoading(false);

        // Show the existing user alert
        showExistingUserAlert({
          navigation,
          phoneNumber: fullPhoneNumber,
          sendOTP,
          setLoading,
          setError
        });
      } else {
        // New phone number, proceed with OTP verification directly
        await handleNewUserOTP({
          navigation,
          phoneNumber: fullPhoneNumber,
          sendOTP,
          setLoading,
          setError
        });
      }
    } catch (error) {
      setError(error.message || 'Failed to send OTP. Please try again.');
      console.error('Error sending OTP:', error);
      setLoading(false);
    }
  };

  // Effect to validate phone number when country changes
  useEffect(() => {
    if (phoneNumber) {
      // Re-format the phone number according to the new country format
      const formatted = formatPhoneNumber(phoneNumber, selectedCountry.code);
      setFormattedPhoneNumber(formatted);

      // Re-validate with the new country code
      const isValidNumber = validatePhoneNumber(formatted, selectedCountry.code);
      setIsValid(isValidNumber);

      // For testing: If the user enters 1234567890, set it as valid
      if (phoneNumber === '1234567890') {
        setIsValid(true);
      }
    }
  }, [selectedCountry]);

  // For testing purposes - show the alert directly
  const testAlert = () => {
    Alert.alert(
      "Account Found",
      "This phone number is already registered.",
      [
        {
          text: "Continue with OTP",
          onPress: () => {
            console.log("Continue with OTP pressed");
          }
        },
        {
          text: "Continue with Password",
          onPress: () => {
            console.log("Continue with Password pressed");
          }
        }
      ],
      { cancelable: true }
    );
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
            source={{ uri: 'https://img.freepik.com/free-vector/mobile-login-concept-illustration_114360-83.jpg' }}
            style={styles.headerImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: themeColors.text }]}>Login with Phone</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            We'll send you a one-time verification code to verify your phone number
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(800).delay(400)}
          style={styles.form}
        >
          <Text style={[styles.label, { color: themeColors.text }]}>Phone Number</Text>

          {error ? (
            <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
          ) : null}

          <View style={[styles.phoneInputContainer, {
            backgroundColor: themeColors.surface,
            borderColor: error ? themeColors.danger : themeColors.border
          }]}>
            {/* Country Code Picker */}
            <CountryCodePicker
              selectedCountry={selectedCountry}
              onSelectCountry={handleCountrySelect}
              themeColors={themeColors}
            />

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

            {/* Phone Number Input */}
            <TextInput
              style={[styles.phoneInput, { color: themeColors.text }]}
              placeholder={`Format: ${selectedCountry.format}`}
              placeholderTextColor={themeColors.textSecondary}
              value={formattedPhoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
            />
          </View>

          {/* Format example */}
          <Text style={[styles.formatExample, { color: themeColors.textSecondary }]}>
            Example: {selectedCountry.example}
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isValid
                  ? themeColors.primary.default
                  : `${themeColors.primary.default}80`
              }
            ]}
            onPress={handleSendOTP}
            disabled={loading || !isValid}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Submit</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.termsText, { color: themeColors.textSecondary }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>

          {__DEV__ && (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: themeColors.secondary.default,
                  marginTop: spacing.md
                }
              ]}
              onPress={testAlert}
            >
              <Text style={styles.buttonText}>Test Alert (Dev Only)</Text>
            </TouchableOpacity>
          )}
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
  label: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  countryFlag: {
    fontSize: fontSizes.xl,
    marginRight: spacing.sm,
  },
  countryCode: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  divider: {
    width: 1,
    height: '70%',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.base,
  },
  formatExample: {
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'right',
    marginRight: spacing.md,
    fontStyle: 'italic',
  },
  button: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    // elevation: 2,
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
  termsText: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
  },
  bottomSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -20,
    paddingBottom: 20,
    zIndex: 1001,
    elevation: 1001,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  dragHandleArea: {
    width: '100%',
  },
  handleContainer: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    marginVertical: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    paddingVertical: Platform.OS === 'ios' ? 0 : spacing.xs,
  },
  countryListContainer: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.6,
    minHeight: 200,
  },
  countryList: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
    height: '100%',
  },
  countryListContent: {
    paddingBottom: spacing.xxxl,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  noResultsIcon: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  noResultsText: {
    fontSize: fontSizes.base,
    opacity: 0.7,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: 4,
    backgroundColor: 'transparent',
  },
  countryName: {
    flex: 1,
    fontSize: fontSizes.base,
    marginLeft: spacing.md,
  },
  countryCodeItem: {
    fontSize: fontSizes.base,
    fontWeight: '500',
  },
});

export default PhoneLoginScreen;