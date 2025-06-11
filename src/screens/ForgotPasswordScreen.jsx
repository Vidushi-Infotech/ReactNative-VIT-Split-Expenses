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
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const { resetPassword, getErrorMessage, isAndroid } = useAuth();
  const [mobileOrEmail, setMobileOrEmail] = useState('');
  const [inputError, setInputError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number (10 digits)
  const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  // Handle input change
  const handleInputChange = (text) => {
    setMobileOrEmail(text);
    // Clear error when user starts typing
    if (inputError) {
      setInputError('');
    }
  };

  // Validate input and send OTP/Reset Email
  const handleSendOTP = async () => {
    if (!mobileOrEmail.trim()) {
      setInputError('Please enter your mobile number or email ID');
      return;
    }

    // Check if input is a phone number (only digits)
    const isPhoneNumber = /^[0-9]+$/.test(mobileOrEmail.trim());

    if (isPhoneNumber) {
      // For phone numbers, use the existing OTP flow (iOS and Android)
      if (!isValidPhoneNumber(mobileOrEmail.trim())) {
        setInputError('Please enter a valid 10-digit mobile number');
        return;
      }

      // Navigate to OTP verification with phone number
      console.log('Sending OTP to phone:', mobileOrEmail);
      navigation.navigate('OTPVerification', {
        phoneNumber: mobileOrEmail,
        countryCode: '+91',
        isFromForgotPassword: true
      });

      // Show success message
      Alert.alert(
        'OTP Sent',
        `A verification code has been sent to ${mobileOrEmail}`,
        [{ text: 'OK' }]
      );
    } else {
      // For email addresses
      if (!isValidEmail(mobileOrEmail.trim())) {
        setInputError('Please enter a valid email address');
        return;
      }

      // For Android, use Firebase Auth password reset
      if (isAndroid) {
        try {
          setIsLoading(true);
          await resetPassword(mobileOrEmail.trim());
          Alert.alert(
            'Password Reset Email Sent',
            `A password reset link has been sent to ${mobileOrEmail}. Please check your email and follow the instructions to reset your password.`,
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack()
              }
            ]
          );
        } catch (error) {
          console.error('Password reset error:', error);
          Alert.alert('Error', getErrorMessage(error));
        } finally {
          setIsLoading(false);
        }
      } else {
        // For iOS, use the existing OTP flow
        console.log('Sending OTP to email:', mobileOrEmail);
        navigation.navigate('OTPVerification', {
          email: mobileOrEmail,
          isFromForgotPassword: true
        });

        // Show success message
        Alert.alert(
          'OTP Sent',
          `A verification code has been sent to ${mobileOrEmail}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../Assets/ForgotImage.png')}
            style={styles.forgotImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Forgot Password</Text>

        {/* Description */}
        <Text style={styles.description}>
          To reset your password, enter your mobile number/
          Email Address. We'll send you a one-time password
          (OTP).
        </Text>

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mobile Number/ Email ID</Text>
          <TextInput
            style={[
              styles.textInput,
              inputError ? styles.textInputError : null
            ]}
            placeholder="Enter Your Mobile Number/ Email ID"
            placeholderTextColor="#ADB5BD"
            value={mobileOrEmail}
            onChangeText={handleInputChange}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {inputError ? (
            <Text style={styles.errorText}>{inputError}</Text>
          ) : null}
        </View>

        {/* Send OTP Button */}
        <TouchableOpacity
          style={[
            styles.sendOTPButton,
            (mobileOrEmail.trim() && !isLoading) ? styles.sendOTPButtonActive : styles.sendOTPButtonInactive
          ]}
          onPress={handleSendOTP}
          disabled={!mobileOrEmail.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.sendOTPButtonText}>
              {isAndroid && !(/^[0-9]+$/.test(mobileOrEmail.trim())) ? 'Send Reset Email' : 'Send OTP'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity style={styles.backToLogin} onPress={handleBackToLogin}>
          <Text style={styles.backToLoginText}>Back to Login</Text>
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
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  forgotImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
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
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: '#F7FAFC',
  },
  textInputError: {
    borderColor: '#E53E3E',
  },
  errorText: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 4,
  },
  sendOTPButton: {
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 24,
  },
  sendOTPButtonActive: {
    backgroundColor: '#4A90E2',
  },
  sendOTPButtonInactive: {
    backgroundColor: '#CBD5E0',
  },
  sendOTPButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backToLogin: {
    alignSelf: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
