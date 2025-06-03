import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

const PhoneLoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Validate and format phone number input
  const handlePhoneNumberChange = (text) => {
    // Remove any non-numeric characters
    const numericOnly = text.replace(/[^0-9]/g, '');

    // Limit to 10 digits
    const limitedNumber = numericOnly.slice(0, 10);

    setPhoneNumber(limitedNumber);

    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  // Validate phone number
  const validatePhoneNumber = () => {
    if (phoneNumber.length === 0) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (phoneNumber.length < 10) {
      setPhoneError('Phone number must be 10 digits');
      return false;
    }
    if (phoneNumber.length > 10) {
      setPhoneError('Phone number cannot exceed 10 digits');
      return false;
    }
    // Check if it's all numbers (additional validation)
    if (!/^\d{10}$/.test(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSendOTP = () => {
    // Validate phone number before sending OTP
    if (validatePhoneNumber()) {
      // Handle OTP sending logic
      console.log('Sending OTP to:', countryCode + phoneNumber);
      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', {
        phoneNumber: phoneNumber,
        countryCode: countryCode
      });
    }
  };

  const handleBackToLogin = () => {
    // Navigate back to main login screen
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../Assets/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Splitzy</Text>
        </View>

        {/* Welcome Text */}
        <Text style={styles.welcomeText}>Welcome to Splitzy!</Text>

        {/* Phone Login Section */}
        <Text style={styles.loginTitle}>Login with mobile number</Text>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <View style={[
            styles.phoneInputContainer,
            phoneError ? styles.phoneInputContainerError : null
          ]}>
            {/* Country Code Dropdown */}
            <TouchableOpacity style={styles.countryCodeButton} onPress={() => setShowCountryPicker(!showCountryPicker)}>
              <Text style={styles.flagEmoji}>🇮🇳</Text>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {/* Phone Number Input */}
            <TextInput
              style={[
                styles.phoneTextInput,
                phoneError ? styles.phoneTextInputError : null
              ]}
              placeholder="Enter Your Phone Number"
              placeholderTextColor="#ADB5BD"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="numeric"
              autoCapitalize="none"
              maxLength={10}
            />
          </View>

          {/* Country Picker Dropdown */}
          {showCountryPicker && (
            <View style={styles.countryPickerContainer}>
              <TouchableOpacity
                style={styles.countryOption}
                onPress={() => {
                  setCountryCode('+91');
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={styles.countryName}>India</Text>
                <Text style={styles.countryCodeOption}>+91</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.countryOption}
                onPress={() => {
                  setCountryCode('+1');
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.flagEmoji}>🇺🇸</Text>
                <Text style={styles.countryName}>United States</Text>
                <Text style={styles.countryCodeOption}>+1</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.countryOption}
                onPress={() => {
                  setCountryCode('+44');
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.flagEmoji}>🇬🇧</Text>
                <Text style={styles.countryName}>United Kingdom</Text>
                <Text style={styles.countryCodeOption}>+44</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Phone Number Counter */}
          <View style={styles.phoneCounterContainer}>
            <Text style={styles.phoneCounter}>
              {phoneNumber.length}/10 digits
            </Text>
          </View>

          {/* Error Message */}
          {phoneError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{phoneError}</Text>
            </View>
          ) : null}
        </View>

        {/* Send OTP Button */}
        <TouchableOpacity style={styles.sendOTPButton} onPress={handleSendOTP}>
          <Text style={styles.sendOTPButtonText}>Send OTP</Text>
        </TouchableOpacity>

        {/* Back to Login Link */}
        <TouchableOpacity style={styles.backToLoginContainer} onPress={handleBackToLogin}>
          <Text style={styles.backToLoginText}>Back to Email Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A5568',
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 60,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    height: 56,
  },
  phoneInputContainerError: {
    borderColor: '#E53E3E',
    backgroundColor: '#FED7D7',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    minWidth: 80,
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#718096',
  },
  phoneTextInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: 'transparent',
  },
  phoneTextInputError: {
    borderColor: '#E53E3E',
  },
  phoneCounterContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  phoneCounter: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '400',
  },
  errorContainer: {
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#E53E3E',
    fontWeight: '500',
  },
  countryPickerContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    shadowColor: '#000',
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
    borderBottomColor: '#F1F5F9',
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    marginLeft: 8,
  },
  countryCodeOption: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  sendOTPButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 18,
    marginTop: 24,
    marginBottom: 32,
  },
  sendOTPButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default PhoneLoginScreen;
