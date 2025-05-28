import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import RNFirebaseApp from '@react-native-firebase/app';
import RNFirebaseAuthModule from '@react-native-firebase/auth';

// Your web app's Firebase configuration
// These values match those in your google-services.json file
const firebaseConfig = {
  apiKey: "AIzaSyBl4eAbhS3atAteejg3LgQ0aEBpZ16mxnQ",
  authDomain: "vitroi.firebaseapp.com",
  projectId: "vitroi",
  storageBucket: "vitroi.firebasestorage.app",
  messagingSenderId: "115276068172",
  appId: "1:115276068172:android:4bd94301bf0dbe58ec8be9"
};

let app;
let rnApp;
let db = null;
let storage = null;
let RNFirebaseAuth = null;
let isInitialized = false;
let isRNInitialized = false;
let initializationError = null;

// Initialize Firebase Web SDK
const initializeFirebaseApp = () => {
  try {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    return true;
  } catch (error) {
    console.error('Error initializing Firebase Web SDK:', error);
    initializationError = error;
    return false;
  }
};

// Initialize React Native Firebase SDK
const initializeRNFirebaseApp = () => {
  try {
    // RNFirebaseApp is an object, not a function
    if (!RNFirebaseApp.apps || RNFirebaseApp.apps.length === 0) {
      rnApp = RNFirebaseApp.initializeApp(firebaseConfig);
    } else {
      rnApp = RNFirebaseApp.app();
    }

    // Initialize Firebase Auth
    // RNFirebaseAuthModule() returns the auth instance
    RNFirebaseAuth = RNFirebaseAuthModule();
    console.log('React Native Firebase Auth initialized successfully');

    isRNInitialized = true;
    console.log('React Native Firebase SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing React Native Firebase SDK:', error);
    initializationError = error;
    isRNInitialized = false;
    return false;
  }
};

// Initialize Firestore with settings for Hermes
const initializeFirestoreDb = () => {
  try {
    // Use initializeFirestore with enhanced settings for better connectivity
    // Note: experimentalForceLongPolling and experimentalAutoDetectLongPolling cannot be used together
    db = initializeFirestore(app, {
      // Use auto-detection instead of forcing long polling
      experimentalAutoDetectLongPolling: true, // Auto-detect best connection method
      useFetchStreams: false, // This helps with Hermes compatibility
      cacheSizeBytes: 50 * 1024 * 1024, // Increase cache size to 50MB for better offline support
      ignoreUndefinedProperties: true, // More forgiving data handling
    });

    // Verify that Firestore is working
    if (!db) {
      throw new Error('Firestore initialization returned null');
    }

    console.log('Firestore initialized successfully with enhanced settings');
    return true;
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    db = null;
    initializationError = error;
    return false;
  }
};

// Initialize Firebase Storage
const initializeFirebaseStorage = () => {
  try {
    storage = getStorage(app);

    // Verify that Storage is working
    if (!storage) {
      throw new Error('Storage initialization returned null');
    }

    return true;
  } catch (error) {
    console.error('Error initializing Firebase Storage:', error);
    storage = null;
    initializationError = error;
    return false;
  }
};

// Attempt to initialize all Firebase services
try {
  // Step 1: Initialize Firebase Web SDK
  const appInitialized = initializeFirebaseApp();

  // Step 2: Initialize React Native Firebase SDK
  const rnAppInitialized = initializeRNFirebaseApp();

  if (appInitialized) {
    // Step 3: Initialize Firestore
    const firestoreInitialized = initializeFirestoreDb();

    // Step 4: Initialize Storage
    const storageInitialized = initializeFirebaseStorage();

    // Set initialization status
    isInitialized = firestoreInitialized || storageInitialized;

    if (isInitialized) {
      console.log('Firebase Web SDK services initialized successfully');
    } else {
      console.error('Failed to initialize Firebase Web SDK services');
    }
  } else {
    console.error('Failed to initialize Firebase Web SDK app');
  }

  if (!rnAppInitialized) {
    console.error('Failed to initialize React Native Firebase SDK');
  }
} catch (error) {
  console.error('Unexpected error during Firebase initialization:', error);
  initializationError = error;
  isInitialized = false;
}

// Function to check if Firebase is initialized
const isFirebaseInitialized = () => {
  return isInitialized;
};

// Function to check if React Native Firebase is initialized
const isRNFirebaseInitialized = () => {
  return isRNInitialized;
};

// Function to get initialization error
const getInitializationError = () => {
  return initializationError;
};

// Function to get Firestore instance
const getFirestoreDb = () => {
  if (!isInitialized || !db) {
    console.error('Firebase Firestore is not initialized or unavailable.');
    return null;
  }
  return db;
};

// Function to get Storage instance
const getFirebaseStorage = () => {
  if (!isInitialized || !storage) {
    console.error('Firebase Storage is not initialized or unavailable.');
    return null;
  }
  return storage;
};

// Function to reinitialize Firebase
const reinitializeFirebase = async () => {
  console.log('Attempting to reinitialize Firebase...');

  // Step 1: Initialize Firebase Web SDK
  const appInitialized = initializeFirebaseApp();

  // Step 2: Initialize React Native Firebase SDK
  const rnAppInitialized = initializeRNFirebaseApp();

  if (appInitialized) {
    // Step 3: Initialize Firestore
    const firestoreInitialized = initializeFirestoreDb();

    // Step 4: Initialize Storage
    const storageInitialized = initializeFirebaseStorage();

    // Set initialization status
    isInitialized = firestoreInitialized || storageInitialized;

    if (isInitialized) {
      console.log('Firebase Web SDK services reinitialized successfully');
    } else {
      console.error('Failed to reinitialize Firebase Web SDK services');
    }
  } else {
    console.error('Failed to reinitialize Firebase Web SDK app');
  }

  if (!rnAppInitialized) {
    console.error('Failed to reinitialize React Native Firebase SDK');
  }

  return isInitialized && isRNInitialized;
};

export {
  getFirestoreDb,
  getFirebaseStorage,
  isFirebaseInitialized,
  isRNFirebaseInitialized,
  getInitializationError,
  reinitializeFirebase,
  RNFirebaseApp,
  RNFirebaseAuth
};
