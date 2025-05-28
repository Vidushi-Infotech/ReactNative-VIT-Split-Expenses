import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import {
  getFirestoreDb,
  isFirebaseInitialized,
  isRNFirebaseInitialized,
  getInitializationError,
  reinitializeFirebase,
  RNFirebaseAuth
} from '../config/firebase';
import { extractCountryCodeAndNumber } from '../utils/phoneUtils';

// Create the context
const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  userProfile: null,
  login: () => {},
  logout: () => {},
  sendOTP: () => {},
  verifyOTP: () => {},
  setupProfile: () => {},
  updateProfile: () => {},
  confirmationResult: null,
  verificationId: null,
});

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verificationId, setVerificationId] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('=== AUTH CONTEXT: CHECK AUTH STATUS START ===');
      try {
        // Reset state to ensure a clean start
        setIsAuthenticated(false);
        setUserProfile(null);
        setIsNewUser(false);

        // Check if the user is in the middle of registration
        const isRegistering = await AsyncStorage.getItem('isRegistering');
        console.log('isRegistering flag:', isRegistering);

        // Check if the user is navigating to password creation
        const navigatingToPasswordCreation = await AsyncStorage.getItem('navigatingToPasswordCreation');
        console.log('navigatingToPasswordCreation flag:', navigatingToPasswordCreation);

        // If the user is in the middle of registration, don't authenticate
        if (isRegistering === 'true' || navigatingToPasswordCreation === 'true') {
          console.log('User is in the middle of registration, not authenticating');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Check if the isAuthenticated flag is set in AsyncStorage
        const isAuthenticatedFlag = await AsyncStorage.getItem('isAuthenticated');
        console.log('isAuthenticated flag:', isAuthenticatedFlag);

        // Check if user profile exists
        const userProfileData = await AsyncStorage.getItem('userProfile');
        if (userProfileData) {
          const profile = JSON.parse(userProfileData);
          console.log('Found user profile in AsyncStorage:', profile);

          // Always set the user profile in state, even if not authenticated
          // This ensures the profile data is available when needed
          setUserProfile(profile);

          // Check if the profile is complete (has name, password, etc.)
          const isProfileComplete = profile.name &&
                                   (profile.password || profile.currentPassword) &&
                                   profile.phoneNumber;

          console.log('Is profile complete?', isProfileComplete);

          // Check if the isAuthenticated flag is explicitly set to false
          // This would happen when a user logs out but we preserve their profile data
          if (isAuthenticatedFlag === 'false') {
            console.log('isAuthenticated flag is explicitly set to false, user is logged out');
            setIsAuthenticated(false);

            // Store the phone number for future reference even when logged out
            if (profile.phoneNumber) {
              setPhoneNumber(profile.countryCode + profile.phoneNumber);
            }
          }
          // Check if the isAuthenticated flag is set to true and profile is complete
          else if (isAuthenticatedFlag === 'true' && isProfileComplete) {
            console.log('isAuthenticated flag is set and profile is complete, setting as authenticated');
            setIsAuthenticated(true);

            // Store the phone number for future reference
            if (profile.phoneNumber) {
              setPhoneNumber(profile.countryCode + profile.phoneNumber);
            }
          } else if (isProfileComplete) {
            // Check if the profile has a password or currentPassword - this indicates a completed registration
            if (profile.password || profile.currentPassword) {
              console.log('Profile has password and is complete, setting as authenticated');
              setIsAuthenticated(true);

              // Store the phone number for future reference
              if (profile.phoneNumber) {
                setPhoneNumber(profile.countryCode + profile.phoneNumber);
              }
            } else {
              console.log('Profile does not have password, user registration is incomplete');
              // Store the profile but don't set as authenticated
              // This will force the user to complete the registration flow
              setIsAuthenticated(false);
              setIsNewUser(true);

              // Store the phone number for future reference
              if (profile.phoneNumber) {
                setPhoneNumber(profile.countryCode + profile.phoneNumber);
              }

              // Set the isRegistering flag
              await AsyncStorage.setItem('isRegistering', 'true');
            }
          } else {
            console.log('Profile is incomplete, user registration is incomplete');
            setIsAuthenticated(false);
            setIsNewUser(true);

            // Set the isRegistering flag
            await AsyncStorage.setItem('isRegistering', 'true');

            // Store the phone number for future reference
            if (profile.phoneNumber) {
              setPhoneNumber(profile.countryCode + profile.phoneNumber);
            }
          }
        } else {
          console.log('No user profile found in AsyncStorage');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Send OTP function
  const sendOTP = async (phoneNum) => {
    console.log('=== AUTH CONTEXT: SEND OTP START ===');
    console.log('AuthContext: sendOTP called with:', phoneNum);
    console.log('AuthContext: Current isAuthenticated state:', isAuthenticated);
    console.log('AuthContext: Current userProfile:', userProfile);
    console.log('AuthContext: Current isNewUser state before reset:', isNewUser);

    // Reset authentication state for new phone verification
    // This ensures we don't carry over state from previous verifications
    setIsNewUser(false);
    console.log('AuthContext: isNewUser reset to false');

    // Store the phone number in state
    setPhoneNumber(phoneNum);

    try {
      // Extract country code and phone number using the utility function
      const { phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNum);

      // Reset authentication state for this phone number
      setIsAuthenticated(false);

      // Check if user exists in Firestore
      const db = getFirestoreDb();
      if (db) {
        console.log('AuthContext: Checking if user exists in Firestore');

        try {
          const usersRef = collection(db, 'Users');
          const q = query(usersRef, where("phoneNumber", "==", phoneNumberOnly));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            console.log('AuthContext: User found in Firestore');
            setIsNewUser(false);
            console.log('AuthContext: isNewUser set to false (user found in Firestore)');

            // Check if the user has a password or currentPassword
            const userData = querySnapshot.docs[0].data();
            if (!userData.password && !userData.currentPassword) {
              console.log('AuthContext: User found but has no password, treating as new user');
              setIsNewUser(true);
              console.log('AuthContext: isNewUser set to true (user has no password)');
            }
          } else {
            console.log('AuthContext: User not found in Firestore, treating as new user');
            setIsNewUser(true);
            console.log('AuthContext: isNewUser set to true (user not found in Firestore)');
          }
        } catch (firestoreError) {
          console.error('AuthContext: Error querying Firestore:', firestoreError);
          setIsNewUser(true);
        }
      } else {
        // Check if user exists in local storage if Firestore is not available
        try {
          const userProfileData = await AsyncStorage.getItem('userProfile');

          if (userProfileData) {
            const userProfile = JSON.parse(userProfileData);
            if (userProfile.phoneNumber === phoneNumberOnly) {
              setIsNewUser(false);

              // Check if the user has a password or currentPassword
              if (!userProfile.password && !userProfile.currentPassword) {
                console.log('AuthContext: User found in local storage but has no password, treating as new user');
                setIsNewUser(true);
              }
            } else {
              setIsNewUser(true);
            }
          } else {
            setIsNewUser(true);
          }
        } catch (storageError) {
          console.error('AuthContext: Error checking local storage:', storageError);
          setIsNewUser(true);
        }
      }

      // Use development mode for phone authentication
      // This avoids issues with reCAPTCHA and Chrome redirects
      console.log('AuthContext: Using development mode for phone authentication');

      // Reset previous confirmation result and verification ID
      setConfirmationResult(null);
      setVerificationId(null);

      // Create a mock confirmation result that will accept "123456" as the valid OTP
      const mockConfirmationResult = {
        confirm: (code) => {
          return new Promise((resolve, reject) => {
            if (code === '123456') {
              // Mock successful verification
              resolve({
                user: {
                  uid: 'dev-user-' + Date.now(),
                  phoneNumber: phoneNum
                }
              });
            } else {
              // Mock failed verification
              reject(new Error('Invalid verification code'));
            }
          });
        }
      };

      // Store the mock confirmation result
      setConfirmationResult(mockConfirmationResult);

      console.log('AuthContext: Development mode OTP sent successfully');
      return {
        success: true,
        message: 'Development mode: Use code 123456 to verify'
      };
    } catch (error) {
      console.error('AuthContext: Error in sendOTP:', error);
      // Default to new user in case of error
      setIsNewUser(true);

      // Fall back to development mode
      console.log('AuthContext: Falling back to development mode due to error');

      // Create a mock confirmation result that will accept "123456" as the valid OTP
      const mockConfirmationResult = {
        confirm: (code) => {
          return new Promise((resolve, reject) => {
            if (code === '123456') {
              // Mock successful verification
              resolve({
                user: {
                  uid: 'dev-user-' + Date.now(),
                  phoneNumber: phoneNum
                }
              });
            } else {
              // Mock failed verification
              reject(new Error('Invalid verification code'));
            }
          });
        }
      };

      // Store the mock confirmation result
      setConfirmationResult(mockConfirmationResult);

      console.log('AuthContext: Development mode OTP sent successfully');
      return {
        success: true,
        message: 'Development mode: Use code 123456 to verify'
      };
    }
  };

  // Verify OTP function
  const verifyOTP = async (otp) => {
    console.log('=== AUTH CONTEXT: VERIFY OTP START ===');
    console.log('AuthContext: verifyOTP called with:', otp);
    console.log('AuthContext: Current isNewUser state:', isNewUser);
    console.log('AuthContext: Current phoneNumber:', phoneNumber);
    console.log('AuthContext: Current isAuthenticated state:', isAuthenticated);
    console.log('AuthContext: Current userProfile:', userProfile);

    try {
      // In development mode, always accept "123456" as the valid OTP
      if (otp === '123456') {
        console.log('AuthContext: Development mode - OTP "123456" accepted');

        // Generate a mock Firebase user ID
        const mockFirebaseUid = 'dev-user-' + Date.now();

        // CRITICAL FIX: Double-check if this is a new user by checking AsyncStorage
        let finalIsNewUser = isNewUser;
        try {
          const userProfileData = await AsyncStorage.getItem('userProfile');
          if (userProfileData) {
            const profile = JSON.parse(userProfileData);
            const { phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNumber);

            if (profile.phoneNumber === phoneNumberOnly) {
              // User exists in AsyncStorage
              if (profile.password || profile.currentPassword) {
                // User has a password, so they're an existing user
                console.log('AuthContext: User found in AsyncStorage with password, treating as existing user');
                finalIsNewUser = false;
              } else {
                // User exists but has no password, treat as new user
                console.log('AuthContext: User found in AsyncStorage without password, treating as new user');
                finalIsNewUser = true;
              }
            } else {
              // Phone number doesn't match, treat as new user
              console.log('AuthContext: Phone number in AsyncStorage doesn\'t match, treating as new user');
              finalIsNewUser = true;
            }
          } else {
            // No user profile in AsyncStorage, treat as new user
            console.log('AuthContext: No user profile in AsyncStorage, treating as new user');
            finalIsNewUser = true;
          }
        } catch (error) {
          console.error('AuthContext: Error checking AsyncStorage for user profile:', error);
          // Default to the current isNewUser value
        }

        console.log('AuthContext: Final isNewUser determination:', finalIsNewUser);
        setIsNewUser(finalIsNewUser);

        console.log('AuthContext: Returning success with isNewUser:', finalIsNewUser);
        console.log('AuthContext: Mock Firebase UID:', mockFirebaseUid);

        const result = {
          success: true,
          isNewUser: finalIsNewUser,
          firebaseUid: mockFirebaseUid
        };

        console.log('AuthContext: Returning result from verifyOTP:', result);
        return result;
      }

      // For real Firebase verification (when not using 123456)
      if (!confirmationResult) {
        console.error('AuthContext: No confirmation result found. Please request OTP first.');
        return { success: false, message: "Please request a new verification code" };
      }

      console.log('AuthContext: Verifying OTP with Firebase');

      try {
        // Confirm the verification code
        const credential = await confirmationResult.confirm(otp);

        // If we get here, the OTP was valid
        console.log('AuthContext: OTP verified successfully with Firebase');
        console.log('AuthContext: isNewUser status after verification:', isNewUser);

        // Get the Firebase user
        const firebaseUser = credential.user;
        console.log('AuthContext: Firebase user authenticated:', firebaseUser.uid);

        return {
          success: true,
          isNewUser,
          firebaseUid: firebaseUser.uid
        };
      } catch (confirmError) {
        console.error('AuthContext: Error confirming OTP:', confirmError);
        return {
          success: false,
          message: confirmError.message || "Invalid verification code"
        };
      }
    } catch (error) {
      console.error('AuthContext: Error verifying OTP with Firebase:', error);
      return {
        success: false,
        message: error.message || "Invalid verification code"
      };
    }
  };

  // Setup profile function for new users
  const setupProfile = async (profileData) => {
    console.log('AuthContext: setupProfile called with:', profileData);
    try {
      // Check if Firebase is initialized
      if (!isFirebaseInitialized() || !isRNFirebaseInitialized()) {
        console.log('AuthContext: Firebase not initialized, attempting to reinitialize...');

        // Try to reinitialize Firebase
        const reinitialized = await reinitializeFirebase();

        if (!reinitialized) {
          console.error('AuthContext: Firebase reinitialization failed. Falling back to local profile setup.');
          // Fall back to local authentication
          return setupProfileLocally(profileData);
        }

        console.log('AuthContext: Firebase reinitialized successfully');
      }

      // Get Firestore instance
      const db = getFirestoreDb();
      if (!db) {
        console.error('AuthContext: Failed to get Firestore instance. Falling back to local profile setup.');
        // Fall back to local authentication
        return setupProfileLocally(profileData);
      }

      // Extract country code and phone number using the utility function
      // This will correctly identify country codes like "+91" for India
      const { countryCode, phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNumber);

      // Use the phone number as the document ID (primary key)
      // This ensures that each phone number can only have one user profile
      const docId = phoneNumberOnly;

      // Get the current Firebase user
      // RNFirebaseAuth is an object, not a function
      const currentUser = RNFirebaseAuth.currentUser;
      const firebaseUid = currentUser ? currentUser.uid : null;

      // Generate a referral code
      const userIdPart = phoneNumberOnly.substring(0, 4).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const referralCode = `${userIdPart}-${randomPart}`;

      // Create a new user document in Firestore
      const newProfile = {
        ...profileData,
        countryCode: countryCode,
        phoneNumber: phoneNumberOnly,
        firebaseUid: firebaseUid, // Store the Firebase UID
        referralCode: referralCode, // Add referral code
        referredBy: profileData.referredBy || null, // Add referred by field
        referrals: [], // Initialize empty referrals array
        upiId: '', // Add UPI ID field
        isUpiEnabled: false, // Add UPI enabled flag
        isDefaultPayment: false, // Add default payment flag
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('AuthContext: Creating new user profile in Firestore with phone number as ID');

      try {
        // Set the user document with the phone number as the ID
        await setDoc(doc(db, 'Users', docId), newProfile);
        console.log('AuthContext: User added to Firestore with phone number as ID:', docId);

        // Add the document ID to the profile
        const profileWithId = {
          id: docId,
          ...newProfile
        };

        console.log('AuthContext: Setting user profile in state');
        setUserProfile(profileWithId);

        console.log('AuthContext: Saving user profile to AsyncStorage');
        await AsyncStorage.setItem('userProfile', JSON.stringify(profileWithId));

        // Clear the isRegistering flag
        await AsyncStorage.removeItem('isRegistering');

        // Clear the navigatingToPasswordCreation flag
        await AsyncStorage.removeItem('navigatingToPasswordCreation');

        console.log('AuthContext: Setting isAuthenticated to true');
        setIsAuthenticated(true);

        // Set the isAuthenticated flag in AsyncStorage
        await AsyncStorage.setItem('isAuthenticated', 'true');

        return true;
      } catch (firestoreError) {
        console.error('AuthContext: Error saving to Firestore:', firestoreError);
        // Fall back to local authentication
        return setupProfileLocally(profileData);
      }
    } catch (error) {
      console.error('AuthContext: Error in setupProfile:', error);
      // Fall back to local authentication
      return setupProfileLocally(profileData);
    }
  };

  // Helper function to setup profile locally when Firestore fails
  const setupProfileLocally = async (profileData) => {
    try {
      console.log('AuthContext: Attempting to authenticate user locally');
      // Extract country code and phone number using the utility function
      // This will correctly identify country codes like "+91" for India
      const { countryCode, phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNumber);

      // Get the current Firebase user
      const currentUser = RNFirebaseAuth ? RNFirebaseAuth.currentUser : null;
      const firebaseUid = currentUser ? currentUser.uid : null;

      // Generate a referral code
      const userIdPart = phoneNumberOnly.substring(0, 4).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const referralCode = `${userIdPart}-${randomPart}`;

      const localProfile = {
        ...profileData,
        countryCode: countryCode,
        phoneNumber: phoneNumberOnly,
        firebaseUid: firebaseUid, // Store the Firebase UID
        referralCode: referralCode, // Add referral code
        referredBy: profileData.referredBy || null, // Add referred by field
        referrals: [], // Initialize empty referrals array
        upiId: '', // Add UPI ID field
        isUpiEnabled: false, // Add UPI enabled flag
        isDefaultPayment: false, // Add default payment flag
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        id: phoneNumberOnly // Use phone number as ID even for local profile
      };

      setUserProfile(localProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(localProfile));

      // Clear the isRegistering flag
      await AsyncStorage.removeItem('isRegistering');

      // Clear the navigatingToPasswordCreation flag
      await AsyncStorage.removeItem('navigatingToPasswordCreation');

      setIsAuthenticated(true);

      // Set the isAuthenticated flag in AsyncStorage
      await AsyncStorage.setItem('isAuthenticated', 'true');

      console.log('AuthContext: User authenticated locally');
      return true;
    } catch (localError) {
      console.error('AuthContext: Error authenticating user locally:', localError);
      return false;
    }
  };

  // CRITICAL FIX: Login function (for onboarding completion or direct login with profile)
  const login = async (profile = null) => {
    console.log('=== AUTH CONTEXT: LOGIN START ===');
    console.log('Login called with profile:', profile);

    // Set the hasLaunched flag to true to indicate onboarding is complete
    await AsyncStorage.setItem('hasLaunched', 'true');

    // If a profile is provided, set it as the current user profile
    if (profile) {
      console.log('AuthContext: Login with provided profile:', profile);

      // CRITICAL FIX: Ensure the profile has a password or currentPassword
      if (!profile.password && !profile.currentPassword) {
        console.log('CRITICAL FIX: Profile has no password, adding a temporary one');
        profile.password = 'temp-password-' + Date.now();
      }

      console.log('Profile has password?', !!profile.password);
      console.log('Profile has currentPassword?', !!profile.currentPassword);

      // Check if there's an existing profile in AsyncStorage with the same phone number
      try {
        const existingProfileData = await AsyncStorage.getItem('userProfile');
        if (existingProfileData) {
          const existingProfile = JSON.parse(existingProfileData);

          // If the phone numbers match, merge the profiles to preserve existing data
          if (existingProfile.phoneNumber === profile.phoneNumber) {
            console.log('Found existing profile with matching phone number, merging profiles');

            // Merge the profiles, giving priority to the new profile data
            profile = {
              ...existingProfile,
              ...profile,
              // Ensure these fields are updated
              updatedAt: new Date().toISOString()
            };

            console.log('Merged profile:', profile);
          } else {
            console.log('Existing profile has different phone number, using new profile');
          }
        }
      } catch (error) {
        console.error('Error checking for existing profile:', error);
      }

      // CRITICAL FIX: Always treat as an existing user if we're in the login function
      console.log('AuthContext: Treating as existing user, setting as authenticated');

      // Update the user profile
      setUserProfile(profile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));

      // CRITICAL FIX: Explicitly set authenticated to true
      setIsAuthenticated(true);
      await AsyncStorage.setItem('isAuthenticated', 'true');

      console.log('AuthContext: User authenticated successfully, isAuthenticated set to true');

      // CRITICAL FIX: Set ALL navigation flags to ensure navigation works
      console.log('AuthContext: Setting ALL navigation flags in AsyncStorage');
      await AsyncStorage.setItem('forceNavigateToMain', 'true');
      await AsyncStorage.setItem('FORCE_NAVIGATE_TO_MAIN', 'true');
      await AsyncStorage.setItem('FORCE_NAVIGATE_TO_GROUPS', 'true');
      await AsyncStorage.setItem('FORCE_RELOAD', Date.now().toString());

      // CRITICAL FIX: Clear any registration flags
      await AsyncStorage.removeItem('isRegistering');
      await AsyncStorage.removeItem('navigatingToPasswordCreation');

      // Force a re-render of the entire app
      setIsLoading(true);

      // Use a timeout to ensure state changes are processed
      setTimeout(() => {
        setIsLoading(false);
        console.log('AuthContext: Forced re-render of the entire app');

        // Log the final authentication state
        console.log('AuthContext: Final authentication state after login:',
          { isAuthenticated: true, hasProfile: true });
      }, 300);
    }

    // Return the authentication status with explicit true
    return { success: true, isAuthenticated: true };
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('AuthContext: Logging out user');

      // Sign out from Firebase Auth
      try {
        if (RNFirebaseAuth && RNFirebaseAuth.currentUser) {
          await RNFirebaseAuth.signOut();
          console.log('AuthContext: Firebase Auth sign out successful');
        }
      } catch (firebaseError) {
        console.error('AuthContext: Error signing out from Firebase Auth:', firebaseError);
        // Continue with local logout even if Firebase logout fails
      }

      // Instead of removing the user profile, just mark the user as logged out
      // by setting the isAuthenticated flag to false in AsyncStorage
      await AsyncStorage.setItem('isAuthenticated', 'false');

      // Keep the userProfile data in AsyncStorage but clear it from state
      // This way, when the user logs back in with the same number, their profile data is still available
      setUserProfile(null);
      setIsAuthenticated(false);
      setConfirmationResult(null);
      setVerificationId(null);

      console.log('AuthContext: User logged out successfully (profile data preserved)');
      return true;
    } catch (error) {
      console.error('AuthContext: Error logging out:', error);
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (updatedData) => {
    try {
      console.log('AuthContext: updateProfile called with:', updatedData);

      if (!userProfile || !userProfile.id) {
        console.error('AuthContext: Cannot update profile - no user is logged in');
        return Promise.resolve(false);
      }

      // Get the document ID (phone number)
      const docId = userProfile.id;

      // Prepare the update data
      const updateData = {
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };

      // Update the local user profile first
      const updatedProfile = {
        ...userProfile,
        ...updateData,
      };

      // Update state and AsyncStorage
      setUserProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      // Try to update Firestore if available
      if (!isFirebaseInitialized() || !isRNFirebaseInitialized()) {
        console.log('AuthContext: Firebase not initialized, attempting to reinitialize...');

        // Try to reinitialize Firebase
        const reinitialized = await reinitializeFirebase();

        if (!reinitialized) {
          console.error('AuthContext: Firebase reinitialization failed. Profile updated locally only.');
          return Promise.resolve(true);
        }

        console.log('AuthContext: Firebase reinitialized successfully');
      }

      const db = getFirestoreDb();
      if (db) {
        try {
          console.log('AuthContext: Updating user profile in Firestore with ID:', docId);
          // Update the user document in Firestore
          await setDoc(doc(db, 'Users', docId), updateData, { merge: true });
          console.log('AuthContext: User profile updated in Firestore');
        } catch (firestoreError) {
          console.error('AuthContext: Error updating profile in Firestore:', firestoreError);
          // Even if Firestore update fails, we've already updated locally
        }
      } else {
        console.error('AuthContext: Failed to get Firestore instance. Profile updated locally only.');
      }

      return Promise.resolve(true);
    } catch (error) {
      console.error('AuthContext: Error updating user profile:', error);
      // Even if Firestore update fails, we've already updated locally
      return Promise.resolve(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userProfile,
        login,
        logout,
        sendOTP,
        verifyOTP,
        setupProfile,
        updateProfile,
        confirmationResult,
        verificationId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
