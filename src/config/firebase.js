import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

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
let db = null;
let storage = null;
let isInitialized = false;
let initializationError = null;

// Initialize Firebase
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
    console.error('Error initializing Firebase app:', error);
    initializationError = error;
    return false;
  }
};

// Initialize Firestore with settings for Hermes
const initializeFirestoreDb = () => {
  try {
    // Use initializeFirestore with settings to fix "Service firestore is not available" error
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true, // This helps with Hermes compatibility
      useFetchStreams: false, // This helps with Hermes compatibility
    });

    // Verify that Firestore is working
    if (!db) {
      throw new Error('Firestore initialization returned null');
    }

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
  // Step 1: Initialize Firebase app
  const appInitialized = initializeFirebaseApp();

  if (appInitialized) {
    // Step 2: Initialize Firestore
    const firestoreInitialized = initializeFirestoreDb();

    // Step 3: Initialize Storage
    const storageInitialized = initializeFirebaseStorage();

    // Set initialization status
    isInitialized = firestoreInitialized || storageInitialized;

    if (isInitialized) {
      console.log('Firebase services initialized successfully');
    } else {
      console.error('Failed to initialize Firebase services');
    }
  } else {
    console.error('Failed to initialize Firebase app');
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

  // Step 1: Initialize Firebase app
  const appInitialized = initializeFirebaseApp();

  if (appInitialized) {
    // Step 2: Initialize Firestore
    const firestoreInitialized = initializeFirestoreDb();

    // Step 3: Initialize Storage
    const storageInitialized = initializeFirebaseStorage();

    // Set initialization status
    isInitialized = firestoreInitialized || storageInitialized;

    if (isInitialized) {
      console.log('Firebase services reinitialized successfully');
    } else {
      console.error('Failed to reinitialize Firebase services');
    }
  } else {
    console.error('Failed to reinitialize Firebase app');
  }

  return isInitialized;
};

export {
  getFirestoreDb,
  getFirebaseStorage,
  isFirebaseInitialized,
  getInitializationError,
  reinitializeFirebase
};
