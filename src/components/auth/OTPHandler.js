/**
 * OTP Handler Component
 * 
 * This component handles the OTP sending process for new users.
 */

import { navigateToOTPVerification } from '../../utils/otpNavigationUtils';

/**
 * Handle OTP sending for new users
 * 
 * @param {Object} options - The options for the OTP handler
 * @param {Object} options.navigation - The navigation object
 * @param {string} options.phoneNumber - The full phone number with country code
 * @param {Function} options.sendOTP - The function to send OTP
 * @param {Function} options.setLoading - The function to set loading state
 * @param {Function} options.setError - The function to set error state
 * @returns {Promise<boolean>} - Whether the OTP was sent successfully
 */
const handleNewUserOTP = async ({
  navigation,
  phoneNumber,
  sendOTP,
  setLoading,
  setError
}) => {
  console.log('New phone number detected, sending OTP');
  
  try {
    const result = await sendOTP(phoneNumber);
    console.log('OTP send result:', result);

    if (result && result.success) {
      // Set loading to false before navigation to prevent state updates on unmounted component
      setLoading(false);

      // Navigate to OTP verification screen
      console.log('New phone number detected, navigating to OTP verification with isNewUser=true');
      
      navigateToOTPVerification(navigation, {
        phoneNumber: phoneNumber,
        isNewUser: true, // Explicitly set isNewUser to true for new users
        devMode: result.message && result.message.includes('Development mode'),
        devMessage: result.message
      });
      
      return true;
    } else {
      setError(result && result.error ? result.error : 'Failed to send OTP. Please try again.');
      console.error('Failed to send OTP:', result);
      setLoading(false);
      return false;
    }
  } catch (error) {
    setError(error.message || 'Failed to send OTP. Please try again.');
    console.error('Error sending OTP:', error);
    setLoading(false);
    return false;
  }
};

export default handleNewUserOTP;
