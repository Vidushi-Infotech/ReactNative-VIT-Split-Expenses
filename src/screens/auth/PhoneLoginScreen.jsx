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
  Dimensions
} from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import CountryCodePicker from '../../components/common/CountryCodePicker';
import { countryCodes, formatPhoneNumber, validatePhoneNumber } from '../../utils/countryCodesData';

// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');


const PhoneLoginScreen = ({ navigation }) => {
  const { colors: themeColors } = useTheme();
  const { sendOTP } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState(countryCodes.find(c => c.code === "+91") || countryCodes[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);



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
    setError('');

    if (!isValid) {
      setError(`Please enter a valid phone number in the format: ${selectedCountry.example}`);
      return;
    }

    setLoading(true);

    try {
      // Use the sendOTP function from AuthContext
      const fullPhoneNumber = selectedCountry.code + phoneNumber;
      const success = await sendOTP(fullPhoneNumber);

      if (success) {
        // Navigate to OTP verification screen with static OTP
        navigation.navigate('OTPVerification', {
          phoneNumber: fullPhoneNumber,
        });
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
      console.error('Error sending OTP:', error);
    } finally {
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
    }
  }, [selectedCountry]);

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
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.termsText, { color: themeColors.textSecondary }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
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