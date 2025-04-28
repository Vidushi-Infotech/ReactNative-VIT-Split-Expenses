import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseInitialized } from '../config/firebase';
import ExpenseService from './ExpenseService';
import GroupBalanceService from './GroupBalanceService';

/**
 * Service for handling payment-related operations with Firebase
 */
class PaymentService {
  /**
   * Create a new payment in Firestore
   * @param {Object} paymentData - Payment data
   * @returns {Promise<string>} - The ID of the created payment
   */
  static async createPayment(paymentData) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot create payment.');
        throw new Error('Firebase is not initialized');
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        throw new Error('Failed to get Firestore instance');
      }

      // Add the payment to Firestore
      const docRef = await addDoc(collection(db, 'Payments'), {
        ...paymentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: paymentData.status || 'pending', // Default status is pending
      });

      console.log('Payment created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Get all payments for a group
   * @param {string} groupId - The group ID
   * @returns {Promise<Array>} - Array of payments
   */
  static async getPaymentsByGroupId(groupId) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get payments for group.');
        throw new Error('Firebase is not initialized');
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        throw new Error('Failed to get Firestore instance');
      }

      // Query payments for the group
      const q = query(
        collection(db, 'Payments'),
        where('groupId', '==', groupId)
      );

      const querySnapshot = await getDocs(q);
      const payments = [];

      querySnapshot.forEach((doc) => {
        payments.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort payments by date (newest first)
      payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return payments;
    } catch (error) {
      console.error('Error getting payments for group:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   * @param {string} paymentId - The payment ID
   * @param {string} status - The new status (pending, completed, cancelled)
   * @returns {Promise<boolean>} - Success status
   */
  static async updatePaymentStatus(paymentId, status) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot update payment status.');
        throw new Error('Firebase is not initialized');
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        throw new Error('Failed to get Firestore instance');
      }

      // Check if payment exists in Firestore
      const paymentDoc = await getDoc(doc(db, 'Payments', paymentId));

      if (paymentDoc.exists()) {
        // Update existing payment
        await updateDoc(doc(db, 'Payments', paymentId), {
          status: status,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new payment record
        const [groupId, fromUser, toUser] = paymentId.split('_');

        if (!groupId || !fromUser || !toUser) {
          throw new Error('Invalid payment ID format');
        }

        await addDoc(collection(db, 'Payments'), {
          id: paymentId,
          groupId,
          fromUser,
          toUser,
          amount: 0, // Will be updated by balance calculation
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Get payments between two users in a group
   * @param {string} groupId - The group ID
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Array>} - Array of payments
   */
  static async getPaymentsBetweenUsers(groupId, userId1, userId2) {
    try {
      // Get all payments for the group
      const payments = await this.getPaymentsByGroupId(groupId);

      // Filter payments between the two users
      return payments.filter(payment =>
        (payment.fromUser === userId1 && payment.toUser === userId2) ||
        (payment.fromUser === userId2 && payment.toUser === userId1)
      );
    } catch (error) {
      console.error('Error getting payments between users:', error);
      throw error;
    }
  }

  /**
   * Generate payment records based on balances
   * @param {string} groupId - The group ID
   * @param {Object} currentUserProfile - Current user profile
   * @returns {Promise<Array>} - Array of payment records
   */
  static async generatePaymentRecords(groupId, currentUserProfile) {
    try {
      if (!groupId || !currentUserProfile) {
        return [];
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot generate payment records.');
        return [];
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return [];
      }

      // Get balances for the group
      const balances = await ExpenseService.calculateGroupBalances(groupId);

      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'Users'));
      const users = {};
      usersSnapshot.forEach(doc => {
        users[doc.id] = { id: doc.id, ...doc.data() };
      });

      // Get existing payments
      const existingPayments = await this.getPaymentsByGroupId(groupId);

      const paymentRecords = [];

      // Process balances to create payment records
      Object.entries(balances).forEach(([userId, balance]) => {
        // Skip the current user and users with zero balance
        if (userId === currentUserProfile.id || balance === 0) {
          return;
        }

        const user = users[userId] || { id: userId, name: 'Unknown User' };

        // If balance is negative, the user owes money to the current user
        if (balance < 0) {
          // The other user owes money to the current user
          const amount = Math.abs(balance);

          // Check if there's already a payment record for this
          const existingPayment = existingPayments.find(p =>
            p.fromUser === userId &&
            p.toUser === currentUserProfile.id &&
            p.groupId === groupId
          );

          if (existingPayment) {
            paymentRecords.push({
              ...existingPayment,
              amount: amount, // Update amount in case it changed
              user: user,
              type: 'receive', // Current user receives money
            });
          } else {
            // Create a new payment record
            paymentRecords.push({
              id: `${groupId}_${userId}_${currentUserProfile.id}`,
              groupId: groupId,
              fromUser: userId,
              toUser: currentUserProfile.id,
              amount: amount,
              status: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              user: user,
              type: 'receive', // Current user receives money
            });
          }
        } else {
          // The current user owes money to the other user
          const amount = balance;

          // Check if there's already a payment record for this
          const existingPayment = existingPayments.find(p =>
            p.fromUser === currentUserProfile.id &&
            p.toUser === userId &&
            p.groupId === groupId
          );

          if (existingPayment) {
            paymentRecords.push({
              ...existingPayment,
              amount: amount, // Update amount in case it changed
              user: user,
              type: 'pay', // Current user pays money
            });
          } else {
            // Create a new payment record
            paymentRecords.push({
              id: `${groupId}_${currentUserProfile.id}_${userId}`,
              groupId: groupId,
              fromUser: currentUserProfile.id,
              toUser: userId,
              amount: amount,
              status: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              user: user,
              type: 'pay', // Current user pays money
            });
          }
        }
      });

      return paymentRecords;
    } catch (error) {
      console.error('Error generating payment records:', error);
      return [];
    }
  }

  /**
   * Get all split payments for a group
   * @param {string} groupId - The group ID
   * @returns {Promise<Array>} - Array of split payments
   */
  static async getSplitPaymentsByGroupId(groupId) {
    try {
      if (!groupId) {
        return [];
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get split payments for group.');
        return [];
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return [];
      }

      // Query split payments for the group
      const q = query(
        collection(db, 'SplitPayments'),
        where('groupId', '==', groupId)
      );

      const querySnapshot = await getDocs(q);
      const splitPayments = [];

      querySnapshot.forEach((doc) => {
        splitPayments.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return splitPayments;
    } catch (error) {
      console.error('Error getting split payments for group:', error);
      return [];
    }
  }

  /**
   * Get all split payments for an expense
   * @param {string} expenseId - The expense ID
   * @returns {Promise<Array>} - Array of split payments
   */
  static async getSplitPaymentsByExpenseId(expenseId) {
    try {
      if (!expenseId) {
        return [];
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get split payments for expense.');
        return [];
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return [];
      }

      // Query split payments for the expense
      const q = query(
        collection(db, 'SplitPayments'),
        where('expenseId', '==', expenseId)
      );

      const querySnapshot = await getDocs(q);
      const splitPayments = [];

      querySnapshot.forEach((doc) => {
        splitPayments.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return splitPayments;
    } catch (error) {
      console.error('Error getting split payments for expense:', error);
      return [];
    }
  }

  /**
   * Get split payments for a user in a group
   * @param {string} groupId - The group ID
   * @param {string} userId - The user ID
   * @param {string} role - 'payer' (who paid) or 'participant' (who owes)
   * @returns {Promise<Array>} - Array of split payments
   */
  static async getSplitPaymentsByUserInGroup(groupId, userId, role = 'participant') {
    try {
      if (!groupId || !userId) {
        return [];
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get split payments for user in group.');
        return [];
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return [];
      }

      // Determine which field to query based on role
      const fieldName = role === 'payer' ? 'toUser' : 'fromUser';

      // Query split payments for the user in the group
      const q = query(
        collection(db, 'SplitPayments'),
        where('groupId', '==', groupId),
        where(fieldName, '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const splitPayments = [];

      querySnapshot.forEach((doc) => {
        splitPayments.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return splitPayments;
    } catch (error) {
      console.error('Error getting split payments for user in group:', error);
      return [];
    }
  }

  /**
   * Update split payment status
   * @param {string} splitPaymentId - The split payment ID
   * @param {string} status - The new status (pending, completed)
   * @returns {Promise<boolean>} - Success status
   */
  static async updateSplitPaymentStatus(splitPaymentId, status) {
    try {
      if (!splitPaymentId) {
        return false;
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot update split payment status.');
        return false;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return false;
      }

      // Get the split payment details first
      const splitPaymentDoc = await getDoc(doc(db, 'SplitPayments', splitPaymentId));

      if (!splitPaymentDoc.exists()) {
        console.error('Split payment not found:', splitPaymentId);
        return false;
      }

      const splitPayment = {
        id: splitPaymentDoc.id,
        ...splitPaymentDoc.data()
      };

      // Update the split payment status
      await updateDoc(doc(db, 'SplitPayments', splitPaymentId), {
        status: status,
        updatedAt: new Date().toISOString(),
      });

      // If the payment is being marked as completed, update the group balances
      if (status === 'completed' && splitPayment.status !== 'completed') {
        // When a payment is completed, it means the debt is settled
        // Update the group balances to reflect this
        await GroupBalanceService.updateBalancesForPayment(
          splitPayment.groupId,
          splitPayment.fromUser,  // The user who owed money
          splitPayment.toUser,    // The user who was owed money
          splitPayment.amount     // The amount of the payment
        );
      }

      return true;
    } catch (error) {
      console.error('Error updating split payment status:', error);
      return false;
    }
  }

  /**
   * Update all split payment statuses for a user in an expense
   * @param {string} expenseId - The expense ID
   * @param {string} userId - The user ID who owes money
   * @param {string} status - The new status (pending, completed)
   * @returns {Promise<boolean>} - Success status
   */
  static async updateSplitPaymentStatusForUserInExpense(expenseId, userId, status) {
    try {
      if (!expenseId || !userId) {
        return false;
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot update split payment status for user in expense.');
        return false;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return false;
      }

      // Get all split payments for this expense where the user is the payer
      const q = query(
        collection(db, 'SplitPayments'),
        where('expenseId', '==', expenseId),
        where('fromUser', '==', userId)
      );

      const querySnapshot = await getDocs(q);

      // Update each split payment
      const updatePromises = [];

      querySnapshot.forEach((docSnapshot) => {
        const updatePromise = updateDoc(doc(db, 'SplitPayments', docSnapshot.id), {
          status: status,
          updatedAt: new Date().toISOString(),
        });

        updatePromises.push(updatePromise);
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      return true;
    } catch (error) {
      console.error('Error updating split payment statuses for user in expense:', error);
      return false;
    }
  }
  /**
   * Mark a custom amount as received from a user
   * @param {string} groupId - The group ID
   * @param {string} fromUserId - The user who owes money
   * @param {string} toUserId - The user who is owed money
   * @param {number} amount - The amount to mark as received
   * @returns {Promise<boolean>} - Success status
   */
  static async markCustomAmountAsReceived(groupId, fromUserId, toUserId, amount) {
    try {
      if (!groupId || !fromUserId || !toUserId || !amount) {
        console.error('Missing required parameters for markCustomAmountAsReceived');
        return false;
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot mark custom amount as received.');
        return false;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return false;
      }

      // Get all pending split payments from this user to the current user
      const q = query(
        collection(db, 'SplitPayments'),
        where('groupId', '==', groupId),
        where('fromUser', '==', fromUserId),
        where('toUser', '==', toUserId),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('No pending payments found');
        return false;
      }

      // Convert to array and sort by date (oldest first)
      const payments = [];
      querySnapshot.forEach(doc => {
        payments.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by date (oldest first)
      payments.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateA - dateB;
      });

      let remainingAmount = amount;
      const updatedPayments = [];
      const partialPayments = [];

      // Mark payments as completed until we reach the custom amount
      for (const payment of payments) {
        if (remainingAmount <= 0) break;

        if (payment.amount <= remainingAmount) {
          // Mark entire payment as completed
          await this.updateSplitPaymentStatus(payment.id, 'completed');
          updatedPayments.push(payment.id);
          remainingAmount -= payment.amount;
        } else {
          // Handle partial payment by creating a new split payment record
          // with the remaining amount and marking the original as completed

          // First, get the expense details to include in the new record
          const expenseId = payment.expenseId;

          // Create a new split payment record for the remaining amount
          const newSplitPaymentData = {
            groupId: payment.groupId,
            expenseId: payment.expenseId,
            fromUser: payment.fromUser,
            toUser: payment.toUser,
            amount: payment.amount - remainingAmount, // Remaining amount after partial payment
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Copy any other relevant fields from the original payment, ensuring they're not undefined
            date: payment.date || new Date().toISOString(), // Use current date if original date is undefined
            // Copy user details if they exist
            ...(payment.fromUserDetails ? { fromUserDetails: payment.fromUserDetails } : {}),
            ...(payment.toUserDetails ? { toUserDetails: payment.toUserDetails } : {}),
            // Only include expenseDetails if it exists
            ...(payment.expenseDetails ? { expenseDetails: payment.expenseDetails } : {})
          };

          // Add the new split payment to Firestore
          const newSplitPaymentRef = await addDoc(collection(db, 'SplitPayments'), newSplitPaymentData);

          // Mark the original payment as completed
          await this.updateSplitPaymentStatus(payment.id, 'completed');

          updatedPayments.push(payment.id);
          partialPayments.push(newSplitPaymentRef.id);

          // The remaining amount is now 0 since we've used it all
          remainingAmount = 0;
          break;
        }
      }

      console.log(`Marked ${updatedPayments.length} payments as received, total amount: ${amount}`);
      if (partialPayments.length > 0) {
        console.log(`Created ${partialPayments.length} new partial payment records`);
      }

      // Update group balances to reflect the payment
      await GroupBalanceService.updateBalancesForCustomPayment(
        groupId,
        fromUserId,  // The user who owed money
        toUserId,    // The user who was owed money
        amount       // The amount that was paid
      );

      return true;
    } catch (error) {
      console.error('Error marking custom amount as received:', error);
      return false;
    }
  }
}

export default PaymentService;
