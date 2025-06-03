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

const OTPVerificationScreen = ({ navigation, route }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(23);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  const phoneNumber = route?.params?.phoneNumber || '';
  const countryCode = route?.params?.countryCode || '+91';

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
      // Navigate to main app
      navigation.replace('Main');
    } else {
      alert('Please enter complete 6-digit OTP');
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
      
      console.log('Resending OTP to:', countryCode + phoneNumber);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
        <Text style={styles.title}>Verify your phone number</Text>

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
    color: '#2D3748',
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
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  otpInputFilled: {
    borderColor: '#4A90E2',
    backgroundColor: '#EBF8FF',
  },
  verifyButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  verifyButtonActive: {
    backgroundColor: '#4A90E2',
  },
  verifyButtonInactive: {
    backgroundColor: '#CBD5E0',
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
    color: '#4A90E2',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  timerText: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '400',
  },
});

export default OTPVerificationScreen;
