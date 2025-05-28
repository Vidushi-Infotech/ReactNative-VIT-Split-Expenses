import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseInitialized } from '../config/firebase';
import GroupBalanceService from './GroupBalanceService';
import expenseSplitCalculator from '../utils/expenseSplitCalculator';
import retryOperation from '../utils/firestoreRetry';

/**
 * Service for handling expense-related operations with Firebase
 */
class ExpenseService {
  /**
   * Create a new expense in Firestore
   * @param {Object} expenseData - Expense data
   * @returns {Promise<string>} - The ID of the created expense
   */
  static async createExpense(expenseData) {
    try {
      console.log('ExpenseService - Creating expense with data:', expenseData);

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot create expense.');
        throw new Error('Firebase is not initialized');
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        throw new Error('Failed to get Firestore instance');
      }

      // Add the expense to Firestore
      const docRef = await addDoc(collection(db, 'Expenses'), {
        ...expenseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const expenseId = docRef.id;
      console.log('ExpenseService - Expense created with ID:', expenseId);

      // Create split payment records
      await this.createSplitPaymentRecords(expenseId, expenseData);
      console.log('ExpenseService - Split payment records created');

      // Update group balances
      console.log('ExpenseService - Updating group balances');
      const balanceUpdateResult = await GroupBalanceService.updateBalancesForExpense({
        id: expenseId,
        ...expenseData
      });

      console.log('ExpenseService - Balance update result:', balanceUpdateResult);

      return expenseId;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Get all expenses for a group
   * @param {string} groupId - The group ID
   * @returns {Promise<Array>} - Array of expenses
   */
  static async getExpensesByGroupId(groupId) {
    try {
      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot get expenses for group.');
        throw new Error('Firebase is not initialized');
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        throw new Error('Failed to get Firestore instance');
      }

      // Use retry operation for Firestore query
      return await retryOperation(async () => {
        console.log('Fetching expenses for group:', groupId);

        // Query expenses for the group
        const q = query(
          collection(db, 'Expenses'),
          where('groupId', '==', groupId)
        );

        const querySnapshot = await getDocs(q);
        const expenses = [];

        querySnapshot.forEach((doc) => {
          expenses.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Sort expenses by date (newest first)
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log(`Successfully fetched ${expenses.length} expenses for group ${groupId}`);
        return expenses;
      }, 5, 2000); // 5 retries with 2 second initial delay
    } catch (error) {
      console.error('Error getting expenses for group after retries:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Calculate balances for a group
   * @param {string} groupId - The group ID
   * @param {Array} expenses - Array of expenses (optional, will be fetched if not provided)
   * @param {Array} members - Array of group members (optional)
   * @returns {Promise<Object>} - Object with user IDs as keys and balance amounts as values
   */
  static async calculateGroupBalances(groupId, expenses = null, members = null) {
    try {
      // If expenses not provided, fetch them
      if (!expenses) {
        expenses = await this.getExpensesByGroupId(groupId);
      }

      // Initialize balances object
      const balances = {};

      // If members provided, initialize balances for all members
      if (members && Array.isArray(members)) {
        members.forEach(member => {
          if (typeof member === 'string') {
            balances[member] = 0;
          } else if (member && member.id) {
            balances[member.id] = 0;
          }
        });
      }

      // Process each expense to calculate balances
      expenses.forEach(expense => {
        const paidBy = expense.paidBy;
        const participants = expense.participants;
        const amount = parseFloat(expense.amount);

        if (!participants || !Array.isArray(participants) || participants.length === 0) {
          return; // Skip invalid expenses
        }

        // Format participants for the expense split calculator
        const expenseParticipants = participants.map(participantId => {
          // Initialize participant in balances if not exists
          if (!balances[participantId]) {
            balances[participantId] = 0;
          }

          // Set amount paid to 0 by default
          let amountPaid = 0;

          // If this participant is the payer, they paid the full amount
          if (participantId === paidBy) {
            amountPaid = amount;
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

        // Update balances based on the split result
        splitResult.participants.forEach(participant => {
          balances[participant.id] += participant.balance;
        });
      });

      // Round balances to 2 decimal places
      Object.keys(balances).forEach(userId => {
        balances[userId] = parseFloat(balances[userId].toFixed(2));
      });

      return balances;
    } catch (error) {
      console.error('Error calculating group balances:', error);
      throw error;
    }
  }

  /**
   * Create split payment records for an expense
   * @param {string} expenseId - The expense ID
   * @param {Object} expenseData - The expense data
   * @returns {Promise<boolean>} - Success status
   */
  static async createSplitPaymentRecords(expenseId, expenseData) {
    try {
      if (!expenseId || !expenseData || !expenseData.participants || !expenseData.amount) {
        console.error('Missing required data for creating split payment records');
        return false;
      }

      if (!isFirebaseInitialized()) {
        console.error('Firebase is not initialized. Cannot create split payment records.');
        return false;
      }

      const db = getFirestoreDb();
      if (!db) {
        console.error('Failed to get Firestore instance');
        return false;
      }

      const { groupId, participants, amount, paidBy } = expenseData;

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

      // Get split type and custom splits from expense data
      const splitType = expenseData.splitType || 'equal';
      const customSplits = expenseData.customSplits || null;

      // Calculate expense split using the new calculator with split type and custom splits
      const splitResult = expenseSplitCalculator.calculateExpenseSplit(
        expenseParticipants,
        splitType,
        customSplits
      );

      // Create a split payment record for each settlement
      const createPromises = [];

      for (const settlement of splitResult.settlements) {
        // Create the split payment document
        const splitPaymentData = {
          expenseId,
          groupId,
          fromUser: settlement.fromId, // The participant who owes money
          toUser: settlement.toId, // The person who is owed money
          amount: settlement.amount,
          status: 'pending', // Default status is pending
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          description: settlement.description
        };

        // Add to collection
        const addPromise = addDoc(collection(db, 'SplitPayments'), splitPaymentData);
        createPromises.push(addPromise);
      }

      // Wait for all documents to be created
      await Promise.all(createPromises);

      console.log(`Created ${splitResult.settlements.length} split payment records for expense ${expenseId}`);
      return true;
    } catch (error) {
      console.error('Error creating split payment records:', error);
      return false;
    }
  }
}

export default ExpenseService;
