import React, {createContext, useContext, useState, useEffect} from 'react';
import {Platform} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Handle user state changes
  const onAuthStateChanged = user => {
    console.log(
      'Auth state changed:',
      user ? 'User logged in' : 'User logged out',
    );
    setUser(user);
    if (initializing) setInitializing(false);
    setLoading(false);
  };

  useEffect(() => {
    // Only initialize Firebase Auth on Android
    if (Platform.OS === 'android') {
      const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
      return subscriber; // unsubscribe on unmount
    } else {
      // For iOS, just set loading to false since we're not using Firebase Auth yet
      setLoading(false);
      setInitializing(false);
    }
  }, [initializing]);

  // Sign up with email and password (Android only)
  const signUp = async (
    email,
    password,
    firstName,
    lastName,
    phoneNumber = '',
    countryCode = '+91',
  ) => {
    if (Platform.OS !== 'android') {
      throw new Error('Firebase Auth is only available on Android');
    }

    try {
      setLoading(true);
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      // Update user profile with display name
      await userCredential.user.updateProfile({
        displayName: `${firstName} ${lastName}`,
      });

      // Store additional user data in Firestore
      const userData = {
        uid: userCredential.user.uid,
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        phoneNumber: phoneNumber.trim()
          ? `${countryCode}${phoneNumber.trim()}`
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore users collection
      await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .set(userData);

      console.log('User account created & signed in!');
      console.log('User data stored in Firestore:', userData);
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password (Android only)
  const signIn = async (email, password) => {
    if (Platform.OS !== 'android') {
      throw new Error('Firebase Auth is only available on Android');
    }

    try {
      setLoading(true);
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      console.log('User signed in!');
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out (Android only)
  const signOut = async () => {
    if (Platform.OS !== 'android') {
      throw new Error('Firebase Auth is only available on Android');
    }

    try {
      setLoading(true);
      await auth().signOut();
      console.log('User signed out!');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send password reset email (Android only)
  const resetPassword = async email => {
    if (Platform.OS !== 'android') {
      throw new Error('Firebase Auth is only available on Android');
    }

    try {
      await auth().sendPasswordResetEmail(email);
      console.log('Password reset email sent!');
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Get Firebase Auth error message
  const getErrorMessage = error => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email address is already in use by another account.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      case 'auth/weak-password':
        return 'The password is too weak. Please choose a stronger password.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return (
          error.message || 'An unexpected error occurred. Please try again.'
        );
    }
  };

  const value = {
    user,
    loading,
    initializing,
    signUp,
    signIn,
    signOut,
    resetPassword,
    getErrorMessage,
    isAndroid: Platform.OS === 'android',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
