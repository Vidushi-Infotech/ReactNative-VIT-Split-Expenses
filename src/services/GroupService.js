import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Service for handling group-related operations with Firebase
 */
class GroupService {
  /**
   * Create a new group in Firestore
   * @param {Object} groupData - Group data including name, image, and creator
   * @returns {Promise<string>} - The ID of the created group
   */
  static async createGroup(groupData) {
    try {
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
      throw error;
    }
  }

  /**
   * Get all groups for a user
   * @param {string} userId - The user ID (phone number)
   * @returns {Promise<Array>} - Array of groups
   */
  static async getUserGroups(userId) {
    try {
      // Query groups where the user is a member
      const q = query(
        collection(db, 'Groups'),
        where('members', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const groups = [];
      
      querySnapshot.forEach((doc) => {
        groups.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return groups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }

  /**
   * Get a group by ID
   * @param {string} groupId - The group ID
   * @returns {Promise<Object|null>} - The group data or null if not found
   */
  static async getGroupById(groupId) {
    try {
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
      throw error;
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
      const groupRef = doc(db, 'Groups', groupId);
      
      await updateDoc(groupRef, {
        members: arrayUnion(userId),
        updatedAt: new Date().toISOString(),
      });
      
      return true;
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw error;
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
      const groupRef = doc(db, 'Groups', groupId);
      
      await updateDoc(groupRef, {
        members: arrayRemove(userId),
        updatedAt: new Date().toISOString(),
      });
      
      return true;
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  }

  /**
   * Check if a user exists in the database
   * @param {string} phoneNumber - The phone number to check
   * @returns {Promise<Object|null>} - User data if found, null otherwise
   */
  static async checkUserExists(phoneNumber) {
    try {
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
      throw error;
    }
  }
}

export default GroupService;
