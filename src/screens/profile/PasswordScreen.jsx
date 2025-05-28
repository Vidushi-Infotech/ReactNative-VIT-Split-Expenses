import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

const PasswordScreen = () => {
  const { colors: themeColors } = useTheme();
  const { userProfile, updateProfile } = useAuth();
  const navigation = useNavigation();

  // Debug logging to see what's in the user profile
  console.log('PasswordScreen: userProfile:', userProfile);
  console.log('PasswordScreen: Has password?', !!userProfile?.password);
  console.log('PasswordScreen: Has currentPassword?', !!userProfile?.currentPassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Validate password
  const validatePassword = () => {
    // Reset error
    setError('');
    setPasswordMatchError(false);

    // Check if user has a password already (either in password or currentPassword field)
    const hasPassword = userProfile && (userProfile.password || userProfile.currentPassword);

    // If user has a password, check if current password is empty
    if (hasPassword && !currentPassword.trim()) {
      setError('Please enter your current password');
      return false;
    }

    // Check if new password is empty
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return false;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setPasswordMatchError(true);
      return false;
    }

    // Check password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // If user has a password, check if new password is different from current password
    if (hasPassword && newPassword === currentPassword) {
      setError('New password must be different from current password');
      return false;
    }

    return true;
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      // Verify the current password
      if (!userProfile) {
        setError('User profile not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Handle case where user doesn't have a password yet
      // This happens when a user is setting up a password for the first time in settings
      // Check both password and currentPassword fields
      if (!userProfile.password && !userProfile.currentPassword) {
        // For first-time password setup, we don't need to validate the current password
        console.log('PasswordScreen: No password found, treating as first-time password setup');
        console.log('PasswordScreen: userProfile.password:', userProfile.password);
        console.log('PasswordScreen: userProfile.currentPassword:', userProfile.currentPassword);

        // Update the user profile with the new password
        // Also set currentPassword to the same value for future verification
        const success = await updateProfile({
          password: newPassword,
          currentPassword: newPassword
        });

        if (success) {
          // Clear all password fields
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');

          // Show success alert
          Alert.alert(
            'Success',
            'Password set up successfully!'
          );

          setLoading(false);
          return;
        } else {
          setError('Failed to set up password. Please try again.');
          setLoading(false);
          return;
        }
      } else if (currentPassword === '') {
        // If user has a password but didn't enter the current password
        console.log('PasswordScreen: User has a password but didn\'t enter the current password');
        console.log('PasswordScreen: userProfile.password:', userProfile.password);
        console.log('PasswordScreen: userProfile.currentPassword:', userProfile.currentPassword);
        setError('Please enter your current password');
        setLoading(false);
        return;
      }

      // For existing users with a password, verify the current password
      // Check if the entered current password matches the stored password
      // First check if there's a currentPassword field (from password creation)
      // If not, fall back to the password field
      const storedCurrentPassword = userProfile.currentPassword || userProfile.password;

      // Add debug logging to see what's happening with password validation
      console.log('PasswordScreen: Validating current password');
      console.log('PasswordScreen: Entered current password:', currentPassword);
      console.log('PasswordScreen: Stored current password:', storedCurrentPassword);
      console.log('PasswordScreen: Do they match?', currentPassword === storedCurrentPassword);

      if (currentPassword !== storedCurrentPassword) {
        console.log('PasswordScreen: Current password validation failed');
        setError('Current password is incorrect. Please try again.');
        setLoading(false);
        return;
      }

      console.log('PasswordScreen: Current password verified successfully');

      // Update the user profile with the new password
      // Also update the currentPassword field to keep track of the current password
      const success = await updateProfile({
        password: newPassword,
        currentPassword: newPassword
      });

      if (success) {
        // Clear all password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Show success alert without navigation
        Alert.alert(
          'Success',
          'Password updated successfully'
        );
      } else {
        setError('Failed to update password. Please try again.');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle current password visibility
  const toggleCurrentPasswordVisibility = () => {
    setCurrentPasswordVisible(!currentPasswordVisible);
  };

  // Toggle new password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  // Check if user has a password already (either in password or currentPassword field)
  const hasPassword = userProfile && (userProfile.password || userProfile.currentPassword);

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Password</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Change Password
            </Text>

            {error && !error.includes('Current password is incorrect') ? (
              <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
            ) : null}

            {/* Current Password Input - Always show */}
            <>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Enter current password</Text>
              <View style={[styles.passwordContainer, {
                backgroundColor: themeColors.background,
                borderColor: error && error.includes('Current password is incorrect')
                  ? themeColors.danger
                  : themeColors.border
              }]}>
                <TextInput
                  style={[styles.passwordInput, { color: themeColors.text }]}
                  placeholder="Enter current password"
                  placeholderTextColor={themeColors.textSecondary}
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    // Clear error when user types
                    if (error && error.includes('Current password is incorrect')) {
                      setError('');
                    }
                  }}
                  secureTextEntry={!currentPasswordVisible}
                />
                <TouchableOpacity onPress={toggleCurrentPasswordVisibility} style={styles.visibilityToggle}>
                  <Icon
                    name={currentPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {error && error.includes('Current password is incorrect') && (
                <Text style={[styles.fieldErrorText, { color: themeColors.danger, marginTop: -12, marginBottom: 12 }]}>
                  Current password is incorrect
                </Text>
              )}
            </>

            {/* New Password Input */}
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Enter new password</Text>
            <View style={[styles.passwordContainer, {
              backgroundColor: themeColors.background,
              borderColor: themeColors.border
            }]}>
              <TextInput
                style={[styles.passwordInput, { color: themeColors.text }]}
                placeholder="Enter new password"
                placeholderTextColor={themeColors.textSecondary}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  // Check if passwords match when typing in new password field
                  if (confirmPassword.length > 0) {
                    setPasswordMatchError(text !== confirmPassword);
                  }
                }}
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

            {/* Confirm Password Input */}
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Confirm new password</Text>
            <View style={[styles.passwordContainer, {
              backgroundColor: themeColors.background,
              borderColor: passwordMatchError ? themeColors.danger : themeColors.border
            }]}>
              <TextInput
                style={[styles.passwordInput, { color: themeColors.text }]}
                placeholder="Confirm new password"
                placeholderTextColor={themeColors.textSecondary}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  // Check if passwords match when typing in confirm password field
                  setPasswordMatchError(newPassword !== text && text.length > 0);
                }}
                secureTextEntry={!confirmPasswordVisible}
              />
              <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.visibilityToggle}>
                <Icon
                  name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {passwordMatchError && (
              <Text style={[styles.fieldErrorText, { color: themeColors.danger, marginTop: -12, marginBottom: 12 }]}>
                Password didn't match
              </Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, {
                backgroundColor: themeColors.primary.default,
                opacity: loading ? 0.7 : 1
              }]}
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                Update Password
              </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldErrorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  visibilityToggle: {
    padding: 8,
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PasswordScreen;
