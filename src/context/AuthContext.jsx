import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // In a real app, you would call an API to send OTP
    setPhoneNumber(phoneNum);

    // For demo purposes, we'll simulate checking if user exists
    // In a real app, this would be determined by your backend
    const randomIsNewUser = Math.random() > 0.5;
    setIsNewUser(randomIsNewUser);

    return true; // Indicate success
  };

  // Verify OTP function
  const verifyOTP = async (otp) => {
    // In a real app, you would validate OTP with your backend

    // If existing user, log them in directly
    if (!isNewUser) {
      // For demo, we'll create a mock profile for existing users
      const mockProfile = {
        name: 'Existing User',
        phoneNumber: phoneNumber,
        avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`,
        createdAt: new Date().toISOString(),
      };

      setUserProfile(mockProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(mockProfile));
      setIsAuthenticated(true);
    }

    return { success: true, isNewUser };
  };

  // Setup profile function for new users
  const setupProfile = async (profileData) => {
    // In a real app, you would send this data to your backend
    const newProfile = {
      ...profileData,
      phoneNumber: phoneNumber,
      createdAt: new Date().toISOString(),
    };

    setUserProfile(newProfile);
    await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
    setIsAuthenticated(true);

    return true;
  };

  // Login function (for onboarding completion)
  const login = async () => {
    // Set the hasLaunched flag to true to indicate onboarding is complete
    await AsyncStorage.setItem('hasLaunched', 'true');

    // Force a re-render of the navigation component
    // This will cause the app to check isFirstLaunch again and show the login screen
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  };

  // Logout function
  const logout = async () => {
    // In a real app, you would clear tokens here
    await AsyncStorage.removeItem('userProfile');
    setUserProfile(null);
    setIsAuthenticated(false);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
