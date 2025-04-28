import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseInitialized } from '../config/firebase';

/**
 * Service for handling group-related operations with Firebase
 */
class GroupService {
  /**
   * Create a new group in Firestore
   * @param {Object} groupData - Group data including name, image, and creator
   * @returns {Promise<string|null>} - The ID of the created group or null if failed
   */
  static async createGroup(groupData) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot create group.');
        return null;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return null;
      }

      // Add the group to Firestore
      const docRef = await addDoc(collection(db, 'Groups'), {
        ...groupData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('Group created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      return null; // Return null instead of throwing to prevent app crashes
    }
  }

  /**
   * Get all groups for a user
   * @param {string} userId - The user ID (phone number)
   * @returns {Promise<Array>} - Array of groups
   */
  static async getUserGroups(userId) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get user groups.');
        return [];
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return [];
      }

      // Query groups where the user is a member
      const q = query(
        collection(db, 'Groups'),
        where('members', 'array-contains', userId)
      );

      const querySnapshot = await getDocs(q);
      const groups = [];

      querySnapshot.forEach((document) => {
        groups.push({
          id: document.id,
          ...document.data(),
        });
      });

      return groups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      return []; // Return empty array instead of throwing to prevent app crashes
    }
  }

  /**
   * Get a group by ID
   * @param {string} groupId - The group ID
   * @returns {Promise<Object|null>} - The group data or null if not found
   */
  static async getGroupById(groupId) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get group by ID.');
        return null;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return null;
      }

      const docRef = doc(db, 'Groups', groupId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        console.log('No such group!');
        return null;
      }
    } catch (error) {
      console.error('Error getting group:', error);
      return null; // Return null instead of throwing to prevent app crashes
    }
  }

  /**
   * Add a member to a group
   * @param {string} groupId - The group ID
   * @param {string} userId - The user ID (phone number) to add
   * @returns {Promise<boolean>} - Success status
   */
  static async addMemberToGroup(groupId, userId) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot add member to group.');
        return false;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return false;
      }

      const groupRef = doc(db, 'Groups', groupId);

      await updateDoc(groupRef, {
        members: arrayUnion(userId),
        updatedAt: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Error adding member to group:', error);
      return false; // Return false instead of throwing to prevent app crashes
    }
  }

  /**
   * Add multiple members to a group
   * @param {string} groupId - The group ID
   * @param {Array<string>} userIds - Array of user IDs to add
   * @returns {Promise<boolean>} - Success status
   */
  static async addMembersToGroup(groupId, userIds) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot add members to group.');
        return false;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return false;
      }

      if (!userIds || userIds.length === 0) {
        return false;
      }

      const groupRef = doc(db, 'Groups', groupId);

      // Get the current group data
      const groupDoc = await getDoc(groupRef);
      if (!groupDoc.exists()) {
        console.error('Group not found');
        return false;
      }

      const groupData = groupDoc.data();
      const currentMembers = groupData.members || [];

      // Add each user ID to the members array if not already present
      const updatedMembers = [...new Set([...currentMembers, ...userIds])];

      // Update the group with the new members list
      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Error adding members to group:', error);
      return false; // Return false instead of throwing to prevent app crashes
    }
  }

  /**
   * Remove a member from a group
   * @param {string} groupId - The group ID
   * @param {string} userId - The user ID (phone number) to remove
   * @returns {Promise<boolean>} - Success status
   */
  static async removeMemberFromGroup(groupId, userId) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot remove member from group.');
        return false;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return false;
      }

      const groupRef = doc(db, 'Groups', groupId);

      await updateDoc(groupRef, {
        members: arrayRemove(userId),
        updatedAt: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Error removing member from group:', error);
      return false; // Return false instead of throwing to prevent app crashes
    }
  }

  /**
   * Check if a user exists in the database
   * @param {string} phoneNumber - The phone number to check
   * @returns {Promise<Object|null>} - User data if found, null otherwise
   */
  static async checkUserExists(phoneNumber) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot check if user exists.');
        return null;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return null;
      }

      // Clean the phone number (remove any non-digit characters)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

      // Query Firestore to check if the phone number exists
      const q = query(
        collection(db, 'Users'),
        where('phoneNumber', '==', cleanPhoneNumber)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // User exists, return the user data
        const userData = querySnapshot.docs[0].data();
        return {
          id: querySnapshot.docs[0].id,
          ...userData,
        };
      }

      // User not found
      return null;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return null; // Return null instead of throwing to prevent app crashes
    }
  }
}

export default GroupService;
