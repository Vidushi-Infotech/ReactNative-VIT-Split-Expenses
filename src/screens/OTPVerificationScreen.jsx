import React, { useState, useEffect, useRef } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import ThemedAlert from '../components/ThemedAlert';

const OTPVerificationScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(23);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  const phoneNumber = route?.params?.phoneNumber || '';
  const countryCode = route?.params?.countryCode || '+91';
  const email = route?.params?.email || '';
  const isFromForgotPassword = route?.params?.isFromForgotPassword || false;

  // Helper function to show themed alerts
  const showThemedAlert = (title, message, buttons = [{ text: 'OK' }]) => {
    setAlertConfig({
      title,
      message,
      buttons: buttons.map(button => ({
        ...button,
        onPress: () => {
          setAlertVisible(false);
          if (button.onPress) button.onPress();
        }
      }))
    });
    setAlertVisible(true);
  };

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value, index) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);

      // Auto-focus next input
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = () => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      // Handle OTP verification
      console.log('Verifying OTP:', otpString);

      // Validate OTP - for demo purposes, accept "123456"
      if (otpString === '123456') {
        if (isFromForgotPassword) {
          // For forgot password flow, navigate to create new password screen
          console.log('OTP verified successfully for forgot password flow');
          navigation.navigate('CreateNewPassword');
        } else {
          // Regular login flow - navigate to main app
          navigation.replace('Main');
        }
      } else {
        showThemedAlert('Invalid OTP', 'Please enter 123456 for demo purposes.');
      }
    } else {
      showThemedAlert('Incomplete OTP', 'Please enter complete 6-digit OTP');
    }
  };

  const handleResendOTP = () => {
    if (canResend) {
      // Reset timer and resend OTP
      setTimer(23);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      
      // Restart timer
      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
      
      if (email) {
        console.log('Resending OTP to email:', email);
      } else {
        console.log('Resending OTP to phone:', countryCode + phoneNumber);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../Assets/VerifyOTP.png')}
            style={styles.verifyOTPImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {email ? 'Verify your email address' : 'Verify your phone number'}
        </Text>

        {/* OTP Input Fields */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity 
          style={[
            styles.verifyButton,
            otp.join('').length === 6 ? styles.verifyButtonActive : styles.verifyButtonInactive
          ]} 
          onPress={handleVerifyOTP}
        >
          <Text style={styles.verifyButtonText}>Verify OTP</Text>
        </TouchableOpacity>

        {/* Resend OTP */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Resend OTP in {formatTime(timer)}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Themed Alert */}
      <ThemedAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  verifyOTPImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    width: '100%',
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  otpInputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryBackground || theme.colors.surface,
  },
  verifyButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  verifyButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  verifyButtonInactive: {
    backgroundColor: theme.colors.disabled || theme.colors.border,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  timerText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
});

export default OTPVerificationScreen;
