import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseInitialized } from '../config/firebase';

/**
 * Service for handling user-related operations with Firebase
 */
class UserService {
  /**
   * Get user by phone number
   * @param {string} phoneNumber - The phone number to search for
   * @returns {Promise<Object|null>} - User data if found, null otherwise
   */
  static async getUserByPhoneNumber(phoneNumber) {
    try {
      console.log('UserService: getUserByPhoneNumber called with:', phoneNumber);

      if (!isFirebaseInitialized()) {
        console.error('UserService: Firebase is not initialized. Cannot get user by phone number.');
        return null;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('UserService: Failed to get Firestore instance');
        return null;
      }

      // Clean the phone number (remove any non-digit characters)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      console.log('UserService: Cleaned phone number:', cleanPhoneNumber);

      // Query Firestore to check if the phone number exists
      console.log('UserService: Querying Firestore for phone number:', cleanPhoneNumber);
      const q = query(
        collection(db, 'Users'),
        where('phoneNumber', '==', cleanPhoneNumber)
      );

      const querySnapshot = await getDocs(q);
      console.log('UserService: Query snapshot empty?', querySnapshot.empty);

      if (!querySnapshot.empty) {
        // User exists, return the user data
        const userData = querySnapshot.docs[0].data();
        console.log('UserService: User found:', userData);
        return {
          id: querySnapshot.docs[0].id,
          ...userData,
        };
      }

      // For testing purposes, let's create a mock user if we're in development mode
      // This is just for testing the alert dialog
      if (__DEV__ && cleanPhoneNumber === '1234567890') {
        console.log('UserService: Creating mock user for testing');
        return {
          id: 'mock-user-id',
          phoneNumber: cleanPhoneNumber,
          name: 'Test User',
          email: 'test@example.com'
        };
      }

      console.log('UserService: User not found');
      // User not found
      return null;
    } catch (error) {
      console.error('UserService: Error getting user by phone number:', error);
      return null; // Return null instead of throwing to prevent app crashes
    }
  }

  /**
   * Get multiple users by phone numbers
   * @param {Array<string>} phoneNumbers - Array of phone numbers to search for
   * @returns {Promise<Array>} - Array of user data
   */
  static async getUsersByPhoneNumbers(phoneNumbers) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get users by phone numbers.');
        return [];
      }

      const users = [];

      // Process each phone number sequentially
      for (const phoneNumber of phoneNumbers) {
        const user = await this.getUserByPhoneNumber(phoneNumber);
        if (user) {
          users.push(user);
        }
      }

      return users;
    } catch (error) {
      console.error('Error getting users by phone numbers:', error);
      return []; // Return empty array instead of throwing to prevent app crashes
    }
  }

  /**
   * Check if multiple phone numbers exist in the database
   * @param {Array<string>} phoneNumbers - Array of phone numbers to check
   * @returns {Promise<Object>} - Object with phoneNumber as key and boolean as value
   */
  static async checkMultiplePhoneNumbers(phoneNumbers) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot check multiple phone numbers.');
        return {};
      }

      const result = {};

      // Process each phone number sequentially
      for (const phoneNumber of phoneNumbers) {
        const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
        const user = await this.getUserByPhoneNumber(cleanPhoneNumber);
        result[phoneNumber] = !!user;
      }

      return result;
    } catch (error) {
      console.error('Error checking multiple phone numbers:', error);
      return {}; // Return empty object instead of throwing to prevent app crashes
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - The user ID to search for
   * @returns {Promise<Object|null>} - User data if found, null otherwise
   */
  static async getUserById(userId) {
    try {
      if (!userId) return null;

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get user by ID.');
        return null;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return null;
      }

      // Get the document reference
      const docRef = doc(db, 'Users', userId);

      // Get the document
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // User exists, return the user data
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      }

      // User not found
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null; // Return null instead of throwing to prevent app crashes
    }
  }

  /**
   * Get all users in the database
   * @returns {Promise<Array>} - Array of all users
   */
  static async getAllUsers() {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get all users.');
        return [];
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return [];
      }

      const querySnapshot = await getDocs(collection(db, 'Users'));
      const users = [];

      querySnapshot.forEach((document) => {
        users.push({
          id: document.id,
          ...document.data(),
        });
      });

      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return []; // Return empty array instead of throwing to prevent app crashes
    }
  }

  /**
   * Get users who have used a specific referral code
   * @param {string} referralCode - The referral code to search for
   * @returns {Promise<Array>} - Array of users who used the referral code
   */
  static async getUsersByReferralCode(referralCode) {
    try {
      console.log('UserService: getUsersByReferralCode called with:', referralCode);

      if (!referralCode) {
        console.error('UserService: No referral code provided');
        return [];
      }

      if (!isFirebaseInitialized()) {
        console.error('UserService: Firebase is not initialized. Cannot get users by referral code.');
        return [];
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('UserService: Failed to get Firestore instance');
        return [];
      }

      // Query Firestore to find users who used this referral code
      console.log('UserService: Querying Firestore for users with referral code:', referralCode);
      const q = query(
        collection(db, 'Users'),
        where('usedReferralCode', '==', referralCode)
      );

      const querySnapshot = await getDocs(q);
      console.log('UserService: Found', querySnapshot.size, 'users with this referral code');

      const users = [];
      querySnapshot.forEach((document) => {
        users.push({
          id: document.id,
          ...document.data(),
        });
      });

      return users;
    } catch (error) {
      console.error('UserService: Error getting users by referral code:', error);
      return []; // Return empty array instead of throwing to prevent app crashes
    }
  }
}

export default UserService;
