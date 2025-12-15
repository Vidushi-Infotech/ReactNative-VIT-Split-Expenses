import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useTheme} from '../context/ThemeContext';
import watiService from '../services/watiService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const PhoneLoginScreen = ({navigation}) => {
  const {theme} = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('whatsapp'); // 'whatsapp' or 'sms'
  const [isLoading, setIsLoading] = useState(false);
  const [whatsappAvailable, setWhatsappAvailable] = useState(null);
  const [checkingWhatsApp, setCheckingWhatsApp] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Countries data with more options
  const countries = [
    { code: '+91', name: 'India', flag: '🇮🇳', length: 10 },
    { code: '+1', name: 'United States', flag: '🇺🇸', length: 10 },
    { code: '+44', name: 'United Kingdom', flag: '🇬🇧', length: 11 },
    { code: '+61', name: 'Australia', flag: '🇦🇺', length: 9 },
    { code: '+81', name: 'Japan', flag: '🇯🇵', length: 11 },
    { code: '+86', name: 'China', flag: '🇨🇳', length: 11 },
  ];

  const currentCountry = countries.find(c => c.code === countryCode) || countries[0];

  // Animation on component mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Check WhatsApp availability when phone number changes
  useEffect(() => {
    if (phoneNumber.length === currentCountry.length) {
      // Temporarily disable availability check due to API issues
      // checkWhatsAppAvailability();
      
      // For now, assume WhatsApp is available for testing
      setWhatsappAvailable(true);
    } else {
      setWhatsappAvailable(null);
    }
  }, [phoneNumber, countryCode]);

  // Validate and format phone number input
  const handlePhoneNumberChange = text => {
    // Remove any non-numeric characters
    const numericOnly = text.replace(/[^0-9]/g, '');

    // Limit to country-specific length
    const limitedNumber = numericOnly.slice(0, currentCountry.length);

    setPhoneNumber(limitedNumber);

    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  // Check if WhatsApp is available for this number
  const checkWhatsAppAvailability = async () => {
    if (phoneNumber.length !== currentCountry.length) return;
    
    setCheckingWhatsApp(true);
    try {
      const fullNumber = countryCode + phoneNumber;
      const availability = await watiService.checkWhatsAppAvailability(fullNumber);
      setWhatsappAvailable(availability.whatsappExists);
      
      // Auto-select WhatsApp if available, SMS if not
      if (availability.whatsappExists && selectedMethod !== 'whatsapp') {
        setSelectedMethod('whatsapp');
      } else if (!availability.whatsappExists && selectedMethod === 'whatsapp') {
        setSelectedMethod('sms');
      }
    } catch (error) {
      console.log('Could not check WhatsApp availability:', error);
      setWhatsappAvailable(false);
    } finally {
      setCheckingWhatsApp(false);
    }
  };

  // Validate phone number
  const validatePhoneNumber = () => {
    if (phoneNumber.length === 0) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (phoneNumber.length < currentCountry.length) {
      setPhoneError(`Phone number must be ${currentCountry.length} digits`);
      return false;
    }
    if (phoneNumber.length > currentCountry.length) {
      setPhoneError(`Phone number cannot exceed ${currentCountry.length} digits`);
      return false;
    }
    // Check if it's all numbers
    const regex = new RegExp(`^\\d{${currentCountry.length}}$`);
    if (!regex.test(phoneNumber)) {
      setPhoneError(`Please enter a valid ${currentCountry.length}-digit phone number`);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSendOTP = async () => {
    // Validate phone number before sending OTP
    if (!validatePhoneNumber()) {
      return;
    }

    setIsLoading(true);
    const fullPhoneNumber = countryCode + phoneNumber;

    try {
      console.log(`🚀 Sending ${selectedMethod.toUpperCase()} OTP to:`, fullPhoneNumber);
      
      const result = await watiService.sendOTP(fullPhoneNumber, selectedMethod);
      
      if (result.success) {
        // Show success message
        const methodName = result.provider === 'whatsapp' ? 'WhatsApp' : 'SMS';
        Alert.alert(
          'OTP Sent Successfully!',
          `Verification code has been sent to your ${methodName}.${result.fallback ? ' (Sent via SMS as backup)' : ''}`,
          [{ text: 'OK' }]
        );

        // Navigate to OTP verification screen with additional data
        navigation.navigate('OTPVerification', {
          phoneNumber: phoneNumber,
          countryCode: countryCode,
          fullPhoneNumber: fullPhoneNumber,
          provider: result.provider,
          messageId: result.messageId,
          otpForTesting: result.otp, // Remove this in production
          selectedMethod: selectedMethod,
        });
      } else {
        throw new Error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      
      let errorMessage = 'Could not send verification code. Please try again.';
      let showRetry = true;
      
      // Provide specific error messages based on the error
      if (error.message.includes('401')) {
        errorMessage = 'Authentication failed. Please contact support.';
        showRetry = false;
      } else if (error.message.includes('403')) {
        errorMessage = 'Service temporarily unavailable. Please try SMS instead.';
      } else if (error.message.includes('Invalid response')) {
        errorMessage = 'Service error. Trying SMS fallback automatically.';
      } else if (error.message.includes('Failed to send WhatsApp')) {
        errorMessage = 'WhatsApp delivery failed. Would you like to try SMS instead?';
      }
      
      const alertButtons = [
        { text: 'Cancel', style: 'cancel' }
      ];
      
      if (showRetry) {
        alertButtons.unshift({ text: 'Retry', onPress: handleSendOTP });
      }
      
      if (selectedMethod === 'whatsapp') {
        alertButtons.unshift({ 
          text: 'Try SMS', 
          onPress: () => {
            setSelectedMethod('sms');
            setTimeout(handleSendOTP, 500);
          }
        });
      }
      
      Alert.alert('OTP Send Failed', errorMessage, alertButtons);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle country selection
  const handleCountrySelect = (country) => {
    setCountryCode(country.code);
    setShowCountryPicker(false);
    setPhoneNumber(''); // Clear phone number when country changes
    setWhatsappAvailable(null);
  };

  // const handleBackToLogin = () => {
  //   // Navigate back to main login screen
  //   navigation.goBack();
  // };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <Image
            source={require('../Assets/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Welcome Text */}
        <Animated.Text style={[styles.welcomeText, { opacity: fadeAnim }]}>
          Welcome to Splitzy!
        </Animated.Text>

        {/* Sign In Section */}
        <Text style={styles.signInTitle}>Login with Phone Number</Text>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <View
            style={[
              styles.phoneInputContainer,
              phoneError ? styles.phoneInputContainerError : null,
            ]}>
            {/* Country Code Dropdown */}
            <TouchableOpacity
              style={styles.countryCodeButton}
              onPress={() => setShowCountryPicker(!showCountryPicker)}>
              <Text style={styles.flagEmoji}>{currentCountry.flag}</Text>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Ionicons 
                name={showCountryPicker ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>

            {/* Phone Number Input */}
            <TextInput
              style={[
                styles.phoneTextInput,
                phoneError ? styles.phoneTextInputError : null,
              ]}
              placeholder={`Enter ${currentCountry.length}-digit phone number`}
              placeholderTextColor={theme.colors.textSecondary}
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="numeric"
              autoCapitalize="none"
              maxLength={currentCountry.length}
            />

            {/* WhatsApp availability indicator */}
            {checkingWhatsApp && (
              <View style={styles.availabilityIndicator}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
            {whatsappAvailable === true && (
              <View style={styles.availabilityIndicator}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </View>
            )}
            {whatsappAvailable === false && phoneNumber.length === currentCountry.length && (
              <View style={styles.availabilityIndicator}>
                <Ionicons name="chatbubble-outline" size={18} color={theme.colors.textMuted} />
              </View>
            )}
          </View>

          {/* Enhanced Country Picker Dropdown */}
          {showCountryPicker && (
            <View style={styles.countryPickerContainer}>
              {countries.map((country, index) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryOption,
                    index === countries.length - 1 && styles.lastCountryOption
                  ]}
                  onPress={() => handleCountrySelect(country)}>
                  <Text style={styles.flagEmoji}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryCodeOption}>{country.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Phone Number Counter */}
          <View style={styles.phoneCounterContainer}>
            <Text style={styles.phoneCounter}>
              {phoneNumber.length}/{currentCountry.length} digits
            </Text>
            {whatsappAvailable === true && (
              <Text style={styles.whatsappAvailableText}>
                <Ionicons name="checkmark-circle" size={14} color="#25D366" /> WhatsApp Available
              </Text>
            )}
          </View>

          {/* Error Message */}
          {phoneError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{phoneError}</Text>
            </View>
          ) : null}
        </View>

        {/* WhatsApp Only Message */}
        {phoneNumber.length === currentCountry.length && (
          <View style={styles.methodSelectionContainer}>
            <Text style={styles.methodSelectionTitle}>Verification via WhatsApp</Text>
            
            <View style={styles.whatsappOnlyContainer}>
              <View style={styles.whatsappOnlyOption}>
                <View style={styles.methodIcon}>
                  <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.whatsappOnlyTitle}>WhatsApp OTP</Text>
                  <Text style={styles.whatsappOnlySubtitle}>
                    Verification code will be sent to your WhatsApp
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#25D366" />
              </View>
              
              {/* Development Note */}
              <View style={styles.developmentNote}>
                <Ionicons name="information-circle" size={16} color={theme.colors.textMuted} />
                <Text style={styles.developmentNoteText}>
                  If WhatsApp fails, OTP will be logged in console for development
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Send OTP Button */}
        <TouchableOpacity 
          style={[
            styles.sendOTPButton,
            (isLoading || phoneNumber.length !== currentCountry.length) && styles.sendOTPButtonDisabled
          ]} 
          onPress={handleSendOTP}
          disabled={isLoading || phoneNumber.length !== currentCountry.length}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.sendOTPButtonText}>
                Sending WhatsApp OTP...
              </Text>
            </View>
          ) : (
            <Text style={styles.sendOTPButtonText}>
              Send WhatsApp OTP
            </Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 32,
      paddingTop: 80,
      paddingBottom: 0,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 10,
    },
    logo: {
      width: 200,
      height: 200,
      marginBottom: 0,
    },
    brandName: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: 25,
      fontWeight: '60',
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 30,
    },
    signInTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 30,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 32,
    },
    inputLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      fontWeight: '500',
    },
    phoneInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      height: 56,
    },
    phoneInputContainerError: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.errorBackground || theme.colors.surface,
    },
    countryCodeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 5,
      paddingVertical: 0,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
      minWidth: 80,
    },
    flagEmoji: {
      fontSize: 15,
      marginRight: 6,
    },
    countryCodeText: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
      marginRight: 4,
    },
    dropdownArrow: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    phoneTextInput: {
      flex: 1,
      paddingHorizontal: 7,
      paddingVertical: 0,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: 'transparent',
    },
    phoneTextInputError: {
      borderColor: theme.colors.error,
    },
    phoneCounterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    phoneCounter: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '400',
    },
    whatsappAvailableText: {
      fontSize: 12,
      color: '#25D366',
      fontWeight: '500',
    },
    availabilityIndicator: {
      paddingHorizontal: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      marginTop: 4,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      fontWeight: '500',
    },
    countryPickerContainer: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      shadowColor: theme.colors.shadow || '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 1000,
    },
    countryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lastCountryOption: {
      borderBottomWidth: 0,
    },
    countryName: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 8,
    },
    countryCodeOption: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    methodSelectionContainer: {
      marginTop: 24,
      marginBottom: 16,
    },
    methodSelectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    methodOptionsContainer: {
      gap: 12,
    },
    methodOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    selectedMethodOption: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    disabledMethodOption: {
      opacity: 0.5,
      backgroundColor: theme.colors.background,
    },
    methodIcon: {
      marginRight: 12,
    },
    methodInfo: {
      flex: 1,
    },
    methodTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    methodSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    disabledMethodText: {
      color: theme.colors.textMuted,
    },
    sendOTPButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 18,
      marginTop: 24,
      marginBottom: 32,
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    sendOTPButtonDisabled: {
      backgroundColor: theme.colors.textMuted,
      shadowOpacity: 0,
      elevation: 0,
    },
    sendOTPButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    whatsappOnlyContainer: {
      gap: 12,
    },
    whatsappOnlyOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#25D366',
      backgroundColor: '#25D366' + '10',
    },
    whatsappOnlyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    whatsappOnlySubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    developmentNote: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      gap: 8,
    },
    developmentNoteText: {
      fontSize: 12,
      color: theme.colors.textMuted,
      flex: 1,
    },
    backToLoginContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    backToLoginText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
  });

export default PhoneLoginScreen;
