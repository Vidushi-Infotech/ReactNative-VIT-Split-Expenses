import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';
import { collection, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { extractCountryCodeAndNumber } from '../../utils/phoneUtils';

const OTPVerificationScreen = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const { isDarkMode, colors: themeColors } = useTheme();
  const { login, verifyOTP, sendOTP } = useAuth();

  const [error, setError] = useState('');

  // Using static OTP "1234" for this implementation
  const [otp, setOtp] = useState(['1', '2', '3', '4']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = [
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
    if (text !== '' && index < 3) {
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
    setError('');
    console.log('Starting OTP verification process');

    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setError('Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);

    try {
      console.log('Verifying OTP:', otpValue);

      // Verify the OTP
      const result = await verifyOTP(otpValue);
      console.log('OTP verification result:', result);

      if (result.success) {
        // Check if the phone number already exists in Firestore
        try {
          console.log('Checking if phone number already exists in Firestore:', phoneNumber);

          // Extract country code and phone number using the utility function
          // This will correctly identify country codes like "+91" for India
          const { countryCode, phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNumber);

          // Check if the phone number already exists in Firestore
          const usersRef = collection(db, 'Users');
          const q = query(usersRef, where("phoneNumber", "==", phoneNumberOnly));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            // Phone number doesn't exist, add a new document with phone number as ID
            console.log('Phone number does not exist in Firestore, adding new document with phone number as ID');

            // Use the phone number as the document ID (primary key)
            const docId = phoneNumberOnly;

            // Create a minimal user document with just the phone verification info
            await setDoc(doc(db, 'Users', docId), {
              countryCode: countryCode,
              phoneNumber: phoneNumberOnly,
              verifiedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });
            console.log('Phone number successfully stored in Firestore with ID:', phoneNumberOnly);

            // New user - navigate to profile setup
            console.log('New user detected, navigating to profile setup');
            navigation.navigate('ProfileSetup', { phoneNumber });
          } else {
            // Phone number already exists - do not store or update anything
            console.log('Phone number already exists in Firestore, not updating any data');

            // Existing user - redirect to home screen (Main navigator)
            console.log('Existing user, redirecting to home screen');

            // Set the user as authenticated in AuthContext
            // This will trigger the navigation to Main in the AppNavigator
            const userDoc = querySnapshot.docs[0].data();
            const userProfile = {
              id: querySnapshot.docs[0].id, // This should be the phone number
              ...userDoc
            };

            // Store the user profile in AsyncStorage through AuthContext
            // This will automatically redirect to the Main navigator
            await login(userProfile);
          }
        } catch (firestoreError) {
          console.error('Error handling phone number in Firestore:', firestoreError);
          // Continue with the flow even if Firestore storage fails
          // Default to treating as a new user
          console.log('Error occurred, defaulting to new user flow');
          navigation.navigate('ProfileSetup', { phoneNumber });
        }
      } else {
        console.log('OTP verification failed:', result.message);
        setError(result.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error in OTP verification process:', error);
      setError('Invalid OTP. Please try again.');
    } finally {
      console.log('Completing OTP verification process');
      setLoading(false);
    }
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
                backgroundColor: otp.join('').length === 4
                  ? themeColors.primary.default
                  : themeColors.primary.default + '80'
              }
            ]}
            onPress={handleVerifyOTP}
            disabled={loading || otp.join('').length !== 4}
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
    width: 65,
    height: 65,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    fontSize: fontSizes.xxl,
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
});

export default OTPVerificationScreen;
