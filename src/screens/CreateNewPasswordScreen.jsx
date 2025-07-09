import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import ThemedAlert from '../components/ThemedAlert';

const CreateNewPasswordScreen = ({navigation}) => {
  const {theme} = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  // Helper function to show themed alerts
  const showThemedAlert = (title, message, buttons = [{text: 'OK'}]) => {
    setAlertConfig({
      title,
      message,
      buttons: buttons.map(button => ({
        ...button,
        onPress: () => {
          setAlertVisible(false);
          if (button.onPress) button.onPress();
        },
      })),
    });
    setAlertVisible(true);
  };

  // Password validation rules
  const validatePassword = pwd => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[@$!%*?&])/.test(pwd)) {
      return 'Password must contain at least one special character (@$!%*?&)';
    }
    return '';
  };

  // Handle password input change
  const handlePasswordChange = text => {
    setPassword(text);
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError('');
    }
  };

  // Handle confirm password input change
  const handleConfirmPasswordChange = text => {
    setConfirmPassword(text);
    // Clear error when user starts typing
    if (confirmPasswordError) {
      setConfirmPasswordError('');
    }
  };

  // Validate and reset password
  const handleResetPassword = () => {
    let isValid = true;

    // Validate password
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (isValid) {
      // Show success message and navigate to login
      showThemedAlert(
        'Password Reset Successful',
        'Your password has been reset successfully. You can now login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to login screen
              navigation.replace('Login');
            },
          },
        ],
      );
    }
  };

  const isFormValid = () => {
    return (
      password.length > 0 &&
      confirmPassword.length > 0 &&
      !passwordError &&
      !confirmPasswordError &&
      password === confirmPassword &&
      validatePassword(password) === ''
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.title}>Create New Password</Text>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={[
              styles.textInput,
              passwordError ? styles.textInputError : null,
            ]}
            placeholder="Enter Your Password"
            placeholderTextColor={theme.colors.textSecondary}
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={[
              styles.textInput,
              confirmPasswordError ? styles.textInputError : null,
            ]}
            placeholder="Confirm Your Password"
            placeholderTextColor={theme.colors.textSecondary}
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}
        </View>

        {/* Password Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password must contain:</Text>
          <Text style={styles.requirementText}>• At least 8 characters</Text>
          <Text style={styles.requirementText}>• One uppercase letter</Text>
          <Text style={styles.requirementText}>• One lowercase letter</Text>
          <Text style={styles.requirementText}>• One number</Text>
          <Text style={styles.requirementText}>
            • One special character (@$!%*?&)
          </Text>
        </View>

        {/* Reset Password Button */}
        <TouchableOpacity
          style={[
            styles.resetButton,
            isFormValid()
              ? styles.resetButtonActive
              : styles.resetButtonInactive,
          ]}
          onPress={handleResetPassword}
          disabled={!isFormValid()}>
          <Text style={styles.resetButtonText}>Reset Password</Text>
        </TouchableOpacity>
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

const createStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 32,
      paddingTop: 60,
      paddingBottom: 40,
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 40,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      fontWeight: '500',
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    textInputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 4,
    },
    requirementsContainer: {
      marginBottom: 32,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    requirementText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    resetButton: {
      borderRadius: 8,
      paddingVertical: 16,
      marginBottom: 24,
    },
    resetButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    resetButtonInactive: {
      backgroundColor: theme.colors.disabled || theme.colors.border,
    },
    resetButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

export default CreateNewPasswordScreen;
