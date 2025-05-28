import React, { useState } from 'react';
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
import UserService from '../../services/UserService';
import { extractCountryCodeAndNumber } from '../../utils/phoneUtils';

const PasswordLoginScreen = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const { colors: themeColors } = useTheme();
  const { login } = useAuth();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handlePasswordLogin = async () => {
    setError('');

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      // Extract the phone number without country code
      const { phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNumber);

      // Get user from Firebase
      const user = await UserService.getUserByPhoneNumber(phoneNumberOnly);

      if (!user) {
        setError('User not found. Please try again.');
        return;
      }

      // Check if password matches
      // In a real app, you would use a secure password comparison method
      // This is a simplified version for demonstration
      if (user.password === password || user.currentPassword === password) {
        // Password matches, log in the user
        await login(user);

        // Set authentication flags
        await AsyncStorage.setItem('isAuthenticated', 'true');
        await AsyncStorage.setItem('FORCE_NAVIGATE_TO_MAIN', 'true');
        await AsyncStorage.setItem('FORCE_NAVIGATE_TO_GROUPS', 'true');

        // Manually navigate to Main screen
        console.log('Password login successful, navigating to Main screen');

        // Use CommonActions for consistent navigation reset
        const { CommonActions } = require('@react-navigation/native');

        try {
          // Get the root navigation if possible
          const rootNavigation = navigation.getParent() || navigation;

          console.log('Using navigation to navigate to Main');
          rootNavigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
          console.log('Navigation to Main completed via CommonActions.reset');
        } catch (resetError) {
          console.error('Error using CommonActions.reset:', resetError);

          // Fallback approach
          try {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
            console.log('Navigation to Main completed via navigation.reset');
          } catch (navError) {
            console.error('Error using navigation.reset:', navError);

            // Last resort
            navigation.navigate('Main');
            console.log('Navigation to Main completed via navigation.navigate');
          }
        }
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (error) {
      console.error('Error logging in with password:', error);
      setError('Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('Navigating to OTP verification for password reset');
    // Navigate to OTP verification for password reset
    // Use replace instead of navigate to prevent going back
    navigation.replace('OTPVerification', {
      phoneNumber: phoneNumber,
      isPasswordReset: true,
      isNewUser: false // Explicitly set isNewUser to false for existing users
    });
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
            source={{ uri: 'https://img.freepik.com/free-vector/mobile-login-concept-illustration_114360-83.jpg' }}
            style={styles.headerImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: themeColors.text }]}>Login with Password</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Enter your password to access your account
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
            borderColor: error ? themeColors.danger : themeColors.border
          }]}>
            <TextInput
              style={[styles.passwordInput, { color: themeColors.text }]}
              placeholder="Enter your password"
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

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
          >
            <Text style={[styles.forgotPasswordText, { color: themeColors.primary.default }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: password.trim()
                  ? themeColors.primary.default
                  : `${themeColors.primary.default}80`
              }
            ]}
            onPress={handlePasswordLogin}
            disabled={loading || !password.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.otpButton}
            onPress={() => {
              console.log('Navigating to OTP verification for existing user');
              // Use replace instead of navigate to prevent going back
              navigation.replace('OTPVerification', {
                phoneNumber: phoneNumber,
                isNewUser: false // Explicitly set isNewUser to false for existing users
              });
            }}
          >
            <Text style={[styles.otpButtonText, { color: themeColors.primary.default }]}>
              Login with OTP instead
            </Text>
          </TouchableOpacity>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotPasswordText: {
    fontSize: fontSizes.sm,
  },
  button: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
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
  otpButton: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  otpButtonText: {
    fontSize: fontSizes.base,
  },
  errorText: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

export default PasswordLoginScreen;
