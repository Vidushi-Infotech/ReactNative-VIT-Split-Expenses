import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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
let db;
let storage;
let isInitialized = false;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize Firestore
  db = getFirestore(app);

  // Initialize Storage
  storage = getStorage(app);

  isInitialized = true;

  // Log initialization
  console.log('Firebase initialized with real project credentials');
} catch (error) {
  console.error('Firebase initialization error:', error);
  isInitialized = false;
}

// Function to check if Firebase is initialized
const isFirebaseInitialized = () => {
  return isInitialized;
};

// Function to get Firestore instance
const getFirestoreDb = () => {
  if (!isInitialized) {
    console.error('Firebase is not initialized. Cannot access Firestore.');
    return null;
  }
  return db;
};

// Function to get Storage instance
const getFirebaseStorage = () => {
  if (!isInitialized) {
    console.error('Firebase is not initialized. Cannot access Storage.');
    return null;
  }
  return storage;
};

export { getFirestoreDb, getFirebaseStorage, isFirebaseInitialized };
