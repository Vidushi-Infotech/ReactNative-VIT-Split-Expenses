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
        // For demo purposes, we'll just check if the user has launched the app before
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');

        // Check if user profile exists
        const userProfileData = await AsyncStorage.getItem('userProfile');
        if (userProfileData) {
          setUserProfile(JSON.parse(userProfileData));
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }

        if (hasLaunched === null) {
          await AsyncStorage.setItem('hasLaunched', 'true');
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

  // Login function (for backward compatibility)
  const login = async () => {
    // In a real app, you would validate credentials and store tokens
    setIsAuthenticated(true);

    // Ensure the hasLaunched flag is set to true
    // This fixes the issue with onboarding navigation
    await AsyncStorage.setItem('hasLaunched', 'true');
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
