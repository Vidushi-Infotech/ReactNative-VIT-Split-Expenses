import { Platform, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';

export const testSignup = async () => {
  if (Platform.OS !== 'android') {
    Alert.alert('Info', 'Firebase Auth is only configured for Android');
    return;
  }

  try {
    console.log('🔥 Testing Firebase Signup...');
    
    // Test user credentials
    const testEmail = 'test@splitzy.com';
    const testPassword = 'test123456';
    const testName = 'Test User';
    
    // Create user account
    const userCredential = await auth().createUserWithEmailAndPassword(testEmail, testPassword);
    
    // Update profile with display name
    await userCredential.user.updateProfile({
      displayName: testName,
    });
    
    console.log('✅ Signup successful!');
    console.log('✅ User ID:', userCredential.user.uid);
    console.log('✅ User Email:', userCredential.user.email);
    console.log('✅ User Name:', userCredential.user.displayName);
    
    Alert.alert(
      'Signup Success! 🎉',
      `Account created successfully!\n\nEmail: ${userCredential.user.email}\nName: ${userCredential.user.displayName}`,
      [{ text: 'OK' }]
    );
    
    return userCredential.user;
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    
    let errorMessage = 'Signup failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered. Try logging in instead.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Please choose a stronger password.';
        break;
      case 'auth/configuration-not':
        errorMessage = 'Email/Password authentication is not enabled in Firebase Console. Please enable it first.';
        break;
      default:
        errorMessage = error.message;
    }
    
    Alert.alert('Signup Failed', errorMessage);
    throw error;
  }
};

export const testLogin = async () => {
  if (Platform.OS !== 'android') {
    Alert.alert('Info', 'Firebase Auth is only configured for Android');
    return;
  }

  try {
    console.log('🔥 Testing Firebase Login...');
    
    // Test user credentials
    const testEmail = 'test@splitzy.com';
    const testPassword = 'test123456';
    
    // Sign in user
    const userCredential = await auth().signInWithEmailAndPassword(testEmail, testPassword);
    
    console.log('✅ Login successful!');
    console.log('✅ User ID:', userCredential.user.uid);
    console.log('✅ User Email:', userCredential.user.email);
    console.log('✅ User Name:', userCredential.user.displayName);
    
    Alert.alert(
      'Login Success! 🎉',
      `Welcome back!\n\nEmail: ${userCredential.user.email}\nName: ${userCredential.user.displayName}`,
      [{ text: 'OK' }]
    );
    
    return userCredential.user;
    
  } catch (error) {
    console.error('❌ Login error:', error);
    
    let errorMessage = 'Login failed. Please try again.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email. Please sign up first.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/configuration-not':
        errorMessage = 'Email/Password authentication is not enabled in Firebase Console. Please enable it first.';
        break;
      default:
        errorMessage = error.message;
    }
    
    Alert.alert('Login Failed', errorMessage);
    throw error;
  }
};

export const testLogout = async () => {
  if (Platform.OS !== 'android') {
    Alert.alert('Info', 'Firebase Auth is only configured for Android');
    return;
  }

  try {
    console.log('🔥 Testing Firebase Logout...');
    
    await auth().signOut();
    
    console.log('✅ Logout successful!');
    
    Alert.alert(
      'Logout Success! 👋',
      'You have been signed out successfully.',
      [{ text: 'OK' }]
    );
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    Alert.alert('Logout Failed', error.message);
    throw error;
  }
};
