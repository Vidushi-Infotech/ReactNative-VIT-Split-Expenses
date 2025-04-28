import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseInitialized } from '../config/firebase';
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
});

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // We don't need to check hasLaunched here anymore
        // This is now handled by the navigation component

        // Check if user profile exists
        const userProfileData = await AsyncStorage.getItem('userProfile');
        if (userProfileData) {
          setUserProfile(JSON.parse(userProfileData));
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }

        // We don't set hasLaunched here anymore
        // Let the onboarding screens handle this
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
    console.log('AuthContext: sendOTP called with:', phoneNum);
    // Store the phone number in state
    setPhoneNumber(phoneNum);

    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot check if user exists.');
        setIsNewUser(true);
        return true; // Still return success to not block the flow
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        setIsNewUser(true);
        return true; // Still return success to not block the flow
      }

      // Check if user exists in Firestore
      console.log('AuthContext: Checking if user exists in Firestore');

      // Extract country code and phone number using the utility function
      // This will correctly identify country codes like "+91" for India
      const { countryCode, phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNum);

      // Query Firestore to check if the phone number exists
      const usersRef = collection(db, 'Users');
      const q = query(usersRef, where("phoneNumber", "==", phoneNumberOnly));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log('AuthContext: User found in Firestore');
        setIsNewUser(false);
      } else {
        console.log('AuthContext: User not found in Firestore, treating as new user');
        setIsNewUser(true);
      }

      return true; // Indicate success
    } catch (error) {
      console.error('AuthContext: Error checking user in Firestore:', error);
      // Default to new user in case of error
      setIsNewUser(true);
      return true; // Still return success to not block the flow
    }
  };

  // Verify OTP function
  const verifyOTP = async (otp) => {
    console.log('AuthContext: verifyOTP called with:', otp);
    // For this implementation, we'll use a static OTP: "1234"
    const staticOTP = "1234";

    if (otp !== staticOTP) {
      console.log('AuthContext: Invalid OTP provided');
      return { success: false, message: "Invalid OTP" };
    }

    console.log('AuthContext: OTP is valid');
    console.log('AuthContext: isNewUser status:', isNewUser);

    // If existing user, log them in directly
    if (!isNewUser) {
      try {
        if (!isFirebaseInitialized()) {
          console.error('Firebase is not initialized. Cannot fetch user profile.');
          setIsNewUser(true);
          return { success: true, isNewUser: true };
        }

        const db = getFirestoreDb();
        if (!db) {
          console.error('Failed to get Firestore instance');
          setIsNewUser(true);
          return { success: true, isNewUser: true };
        }

        console.log('AuthContext: Attempting to fetch existing user profile from Firestore');
        // Extract country code and phone number using the utility function
        // This will correctly identify country codes like "+91" for India
        const { phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNumber);

        // Query for the user by phone number
        const userDocSnap = await getDocs(query(collection(db, 'Users'), where("phoneNumber", "==", phoneNumberOnly)));

        if (!userDocSnap.empty) {
          const userDoc = userDocSnap.docs[0].data();
          const userProfile = {
            id: phoneNumberOnly, // Use phone number as ID
            ...userDoc
          };

          console.log('AuthContext: User profile found in Firestore:', userProfile);
          setUserProfile(userProfile);
          await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
          setIsAuthenticated(true);
          console.log('AuthContext: User authenticated successfully');
        } else {
          console.log('AuthContext: No user profile found in Firestore, treating as new user');
          // If no profile found, treat as new user
          setIsNewUser(true);
        }
      } catch (error) {
        console.error('AuthContext: Error fetching user from Firestore:', error);
        // Don't fail the verification process due to errors
        // Just log the error and continue as if it's a new user
        setIsNewUser(true);
      }
    }

    console.log('AuthContext: Returning success with isNewUser:', isNewUser);
    return { success: true, isNewUser };
  };

  // Setup profile function for new users
  const setupProfile = async (profileData) => {
    console.log('AuthContext: setupProfile called with:', profileData);
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot setup user profile in Firestore.');
        // Fall back to local authentication
        return setupProfileLocally(profileData);
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        // Fall back to local authentication
        return setupProfileLocally(profileData);
      }

      // Extract country code and phone number using the utility function
      // This will correctly identify country codes like "+91" for India
      const { countryCode, phoneNumber: phoneNumberOnly } = extractCountryCodeAndNumber(phoneNumber);

      // Use the phone number as the document ID (primary key)
      // This ensures that each phone number can only have one user profile
      const docId = phoneNumberOnly;

      // Create a new user document in Firestore
      const newProfile = {
        ...profileData,
        countryCode: countryCode,
        phoneNumber: phoneNumberOnly,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('AuthContext: Creating new user profile in Firestore with phone number as ID');

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

      console.log('AuthContext: Setting isAuthenticated to true');
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('AuthContext: Error saving user to Firestore:', error);
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

      const localProfile = {
        ...profileData,
        countryCode: countryCode,
        phoneNumber: phoneNumberOnly,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        id: phoneNumberOnly // Use phone number as ID even for local profile
      };

      setUserProfile(localProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(localProfile));
      setIsAuthenticated(true);
      console.log('AuthContext: User authenticated locally');
      return true;
    } catch (localError) {
      console.error('AuthContext: Error authenticating user locally:', localError);
      return false;
    }
  };

  // Login function (for onboarding completion or direct login with profile)
  const login = async (profile = null) => {
    // Set the hasLaunched flag to true to indicate onboarding is complete
    await AsyncStorage.setItem('hasLaunched', 'true');

    // If a profile is provided, set it as the current user profile
    if (profile) {
      console.log('AuthContext: Login with provided profile:', profile);
      setUserProfile(profile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      setIsAuthenticated(true);
    }

    // Force a re-render of the navigation component
    // This will cause the app to check isFirstLaunch again and show the login screen
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('AuthContext: Logging out user');
      // In a real app, you would clear tokens here
      await AsyncStorage.removeItem('userProfile');
      setUserProfile(null);
      setIsAuthenticated(false);
      console.log('AuthContext: User logged out successfully');
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
      if (isFirebaseInitialized()) {
        const db = getFirestoreDb();
        if (db) {
          console.log('AuthContext: Updating user profile in Firestore with ID:', docId);
          // Update the user document in Firestore
          await setDoc(doc(db, 'Users', docId), updateData, { merge: true });
          console.log('AuthContext: User profile updated in Firestore');
        } else {
          console.error('Failed to get Firestore instance');
        }
      } else {
        console.error('Firebase is not initialized. Cannot update profile in Firestore.');
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
