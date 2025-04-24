import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import ExpenseService from './ExpenseService';

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
}

export default PaymentService;
