import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { getFirestoreDb, isFirebaseInitialized } from '../config/firebase';
import expenseSplitCalculator from '../utils/expenseSplitCalculator';

/**
 * Service for handling group balance calculations and storage
 */
class GroupBalanceService {
  /**
   * Get the document ID for a group-user-otherUser balance record
   * @param {string} groupId - The group ID
   * @param {string} userId - The user ID
   * @param {string} otherUserId - The other user ID
   * @returns {string} - The document ID
   */
  static getBalanceDocId(groupId, userId, otherUserId) {
    // Sort the user IDs to ensure consistent document IDs regardless of order
    const sortedUserIds = [userId, otherUserId].sort();
    return `${groupId}_${sortedUserIds[0]}_${sortedUserIds[1]}`;
  }

  /**
   * Get or create a balance record between two users in a group
   * @param {string} groupId - The group ID
   * @param {string} userId - The user ID
   * @param {string} otherUserId - The other user ID
   * @returns {Promise<Object>} - The balance record
   */
  static async getOrCreateBalanceRecord(groupId, userId, otherUserId) {
    try {
      if (!groupId || !userId || !otherUserId) {
        throw new Error('Missing required parameters');
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get or create balance record.');
        throw new Error('Firebase is not initialized');
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        throw new Error('Failed to get Firestore instance');
      }

      const docId = this.getBalanceDocId(groupId, userId, otherUserId);
      const docRef = doc(db, 'GroupUserBalances', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Return existing record
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }

      // Create new record
      const newRecord = {
        groupId,
        userId,
        otherUserId,
        totalGiven: 0,
        totalReceived: 0,
        netBalance: 0,
        lastUpdated: serverTimestamp()
      };

      await setDoc(docRef, newRecord);
      return {
        id: docId,
        ...newRecord
      };
    } catch (error) {
      console.error('Error getting or creating balance record:', error);
      throw error;
    }
  }

  /**
   * Update the balance between two users in a group
   * @param {string} groupId - The group ID
   * @param {string} fromUserId - The user who is giving money
   * @param {string} toUserId - The user who is receiving money
   * @param {number} amount - The amount of money
   * @returns {Promise<boolean>} - Success status
   */
  static async updateBalance(groupId, fromUserId, toUserId, amount) {
    try {
      if (!groupId || !fromUserId || !toUserId || amount === undefined) {
        console.error('Missing required parameters for updateBalance:', { groupId, fromUserId, toUserId, amount });
        throw new Error('Missing required parameters');
      }

      console.log('GroupBalanceService - Updating balance:', { groupId, fromUserId, toUserId, amount });

      // Get or create balance records for both users
      await this.getOrCreateBalanceRecord(groupId, fromUserId, toUserId);

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot update balance.');
        return false;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return false;
      }

      const docId = this.getBalanceDocId(groupId, fromUserId, toUserId);
      const docRef = doc(db, 'GroupUserBalances', docId);

      // The issue might be in the logic here. Let's simplify it:
      // If fromUserId is giving money to toUserId, then:
      // - fromUserId's totalGiven increases
      // - toUserId's totalReceived increases

      // Check which user comes first in the sorted order (this determines which is userId and which is otherUserId)
      const isFromUserFirst = fromUserId < toUserId;

      // Prepare the update based on which user is first
      let updateData;

      if (isFromUserFirst) {
        // fromUserId is the userId in the record
        updateData = {
          totalGiven: increment(amount),
          netBalance: increment(-amount), // negative because giving money decreases net balance
          lastUpdated: serverTimestamp()
        };
      } else {
        // toUserId is the userId in the record
        updateData = {
          totalReceived: increment(amount),
          netBalance: increment(amount), // positive because receiving money increases net balance
          lastUpdated: serverTimestamp()
        };
      }

      console.log('GroupBalanceService - Update data:', updateData);

      // Update the balance record
      await updateDoc(docRef, updateData);

      console.log('GroupBalanceService - Balance updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating balance:', error);
      return false;
    }
  }

  /**
   * Get all balance records for a user in a group
   * @param {string} groupId - The group ID
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - Array of balance records
   */
  static async getBalanceRecordsForUserInGroup(groupId, userId) {
    try {
      if (!groupId || !userId) {
        console.log('GroupBalanceService - Missing groupId or userId:', { groupId, userId });
        return [];
      }

      console.log('GroupBalanceService - Fetching balance records for:', { groupId, userId });

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get balance records for user in group.');
        return [];
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return [];
      }

      // The issue might be with the query - we need to find records where the user is either
      // the userId or otherUserId. Let's modify the query to find all records related to this user.

      // First, get all records for the group
      const q = query(
        collection(db, 'GroupUserBalances'),
        where('groupId', '==', groupId)
      );

      const querySnapshot = await getDocs(q);
      const balanceRecords = [];

      console.log('GroupBalanceService - Total group records found:', querySnapshot.size);

      // Filter records where the user is involved (either as userId or otherUserId)
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === userId || data.otherUserId === userId) {
          balanceRecords.push({
            id: doc.id,
            ...data
          });
        }
      });

      console.log('GroupBalanceService - Filtered records for user:', balanceRecords.length);
      return balanceRecords;
    } catch (error) {
      console.error('Error getting balance records for user in group:', error);
      return [];
    }
  }

  /**
   * Get all balance records for a group
   * @param {string} groupId - The group ID
   * @returns {Promise<Array>} - Array of balance records
   */
  static async getBalanceRecordsForGroup(groupId) {
    try {
      if (!groupId) {
        return [];
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get balance records for group.');
        return [];
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return [];
      }

      // Query balance records for the group
      const q = query(
        collection(db, 'GroupUserBalances'),
        where('groupId', '==', groupId)
      );

      const querySnapshot = await getDocs(q);
      const balanceRecords = [];

      querySnapshot.forEach((doc) => {
        balanceRecords.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return balanceRecords;
    } catch (error) {
      console.error('Error getting balance records for group:', error);
      return [];
    }
  }

  /**
   * Get the balance summary between two users in a group
   * @param {string} groupId - The group ID
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Object>} - Balance summary
   */
  static async getBalanceBetweenUsers(groupId, userId1, userId2) {
    try {
      if (!groupId || !userId1 || !userId2) {
        return null;
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get balance between users.');
        return null;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return null;
      }

      const docId = this.getBalanceDocId(groupId, userId1, userId2);
      const docRef = doc(db, 'GroupUserBalances', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Determine which user is which in the record
        const isUser1First = userId1 < userId2;

        // Calculate the balance from user1's perspective
        const user1Balance = isUser1First
          ? data.totalReceived - data.totalGiven
          : data.totalGiven - data.totalReceived;

        return {
          id: docSnap.id,
          ...data,
          user1Balance,
          user2Balance: -user1Balance
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting balance between users:', error);
      return null;
    }
  }

  /**
   * Update balances when an expense is created
   * @param {Object} expense - The expense object
   * @returns {Promise<boolean>} - Success status
   */
  static async updateBalancesForExpense(expense) {
    try {
      if (!expense || !expense.id || !expense.groupId || !expense.paidBy || !expense.participants || !expense.amount) {
        console.error('Invalid expense object:', expense);
        return false;
      }

      const { groupId, paidBy, participants, amount } = expense;

      console.log('GroupBalanceService - Updating balances for expense:', {
        expenseId: expense.id,
        groupId,
        paidBy,
        participants,
        amount
      });

      // Format participants for the expense split calculator
      const expenseParticipants = participants.map(participantId => {
        // Set amount paid to 0 by default
        let amountPaid = 0;

        // If this participant is the payer, they paid the full amount
        if (participantId === paidBy) {
          amountPaid = parseFloat(amount);
        }

        return {
          id: participantId,
          name: participantId, // We don't have names here, just use ID
          amountPaid: amountPaid,
          isParticipating: true
        };
      });

      // Calculate expense split using the new calculator
      const splitResult = expenseSplitCalculator.calculateExpenseSplit(expenseParticipants);

      // Update balances based on the settlements
      const updatePromises = [];

      for (const settlement of splitResult.settlements) {
        console.log('GroupBalanceService - Processing settlement:', settlement.description);

        // Update balance based on the settlement
        const updatePromise = this.updateBalance(
          groupId,
          settlement.fromId, // from (participant who owes money)
          settlement.toId,   // to (participant who is owed money)
          settlement.amount
        );

        updatePromises.push(updatePromise);
      }

      // Wait for all balance updates to complete
      await Promise.all(updatePromises);

      console.log('GroupBalanceService - All balances updated for expense:', expense.id);
      return true;
    } catch (error) {
      console.error('Error updating balances for expense:', error);
      return false;
    }
  }

  /**
   * Update balances when a payment is made
   * @param {string} groupId - The group ID
   * @param {string} fromUserId - The user who is paying
   * @param {string} toUserId - The user who is receiving payment
   * @param {number} amount - The payment amount
   * @returns {Promise<boolean>} - Success status
   */
  static async updateBalancesForPayment(groupId, fromUserId, toUserId, amount) {
    try {
      if (!groupId || !fromUserId || !toUserId || amount === undefined) {
        throw new Error('Missing required parameters');
      }

      // When a payment is made, it reduces what the payer owes to the receiver
      // This is the opposite of an expense, so we negate the amount
      await this.updateBalance(groupId, fromUserId, toUserId, -amount);

      return true;
    } catch (error) {
      console.error('Error updating balances for payment:', error);
      return false;
    }
  }

  /**
   * Update balances when a custom amount payment is made
   * @param {string} groupId - The group ID
   * @param {string} fromUserId - The user who is paying
   * @param {string} toUserId - The user who is receiving payment
   * @param {number} amount - The payment amount
   * @returns {Promise<boolean>} - Success status
   */
  static async updateBalancesForCustomPayment(groupId, fromUserId, toUserId, amount) {
    try {
      if (!groupId || !fromUserId || !toUserId || amount === undefined) {
        throw new Error('Missing required parameters');
      }

      console.log('GroupBalanceService - Updating balances for custom payment:', {
        groupId,
        fromUserId,
        toUserId,
        amount
      });

      // Custom payments work the same way as regular payments
      // When a payment is made, it reduces what the payer owes to the receiver
      await this.updateBalance(groupId, fromUserId, toUserId, -amount);

      console.log('GroupBalanceService - Balances updated for custom payment');
      return true;
    } catch (error) {
      console.error('Error updating balances for custom payment:', error);
      return false;
    }
  }
}

export default GroupBalanceService;
