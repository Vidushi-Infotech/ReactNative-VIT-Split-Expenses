/**
 * ExistingUserAlert Component
 * 
 * This component displays an alert dialog when an existing user is detected
 * during the login process. It provides options to continue with OTP or password.
 */

import { Alert } from 'react-native';
import { navigateToOTPVerification, navigateToPasswordLogin } from '../../utils/otpNavigationUtils';

/**
 * Show an alert dialog for existing users
 * 
 * @param {Object} options - The options for the alert
 * @param {Object} options.navigation - The navigation object
 * @param {string} options.phoneNumber - The full phone number with country code
 * @param {Function} options.sendOTP - The function to send OTP
 * @param {Function} options.setLoading - The function to set loading state
 * @param {Function} options.setError - The function to set error state
 */
const showExistingUserAlert = ({
  navigation,
  phoneNumber,
  sendOTP,
  setLoading,
  setError
}) => {
  Alert.alert(
    "Account Found",
    "This phone number is already registered.",
    [
      {
        text: "Continue with OTP",
        onPress: async () => {
          setLoading(true);
          try {
            const result = await sendOTP(phoneNumber);
            setLoading(false);

            if (result && result.success) {
              // Navigate to OTP verification screen
              console.log('Navigating to OTP verification screen for existing user');
              
              navigateToOTPVerification(navigation, {
                phoneNumber: phoneNumber,
                isNewUser: false, // Explicitly set isNewUser to false for existing users
                devMode: result.message && result.message.includes('Development mode'),
                devMessage: result.message
              });
            } else {
              setError(result && result.error ? result.error : 'Failed to send OTP. Please try again.');
            }
          } catch (error) {
            setLoading(false);
            setError(error.message || 'Failed to send OTP. Please try again.');
            console.error('Error sending OTP:', error);
          }
        }
      },
      {
        text: "Continue with Password",
        onPress: () => {
          // Navigate to a password login screen
          navigateToPasswordLogin(navigation, {
            phoneNumber: phoneNumber
          });
        }
      }
    ],
    { cancelable: true }
  );
};

export default showExistingUserAlert;
