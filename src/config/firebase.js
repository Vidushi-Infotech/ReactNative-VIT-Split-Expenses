import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Log initialization
console.log('Firebase initialized with real project credentials');

export { db };
