import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import GroupBalanceService from './GroupBalanceService';

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

      return expenses;
    } catch (error) {
      console.error('Error getting expenses for group:', error);
      throw error;
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

      // Calculate balances based on expenses
      expenses.forEach(expense => {
        const paidBy = expense.paidBy;
        const participants = expense.participants;
        const amount = parseFloat(expense.amount);

        if (!participants || !Array.isArray(participants) || participants.length === 0) {
          return; // Skip invalid expenses
        }

        // Check if the payer is also included in participants
        const payerIsParticipant = participants.includes(paidBy);

        // Calculate amount per person
        const amountPerPerson = amount / participants.length;

        // Initialize paidBy in balances if not exists
        if (!balances[paidBy]) {
          balances[paidBy] = 0;
        }

        // Add the full amount to the person who paid
        balances[paidBy] += amount;

        // Subtract each participant's share
        participants.forEach(participantId => {
          // Initialize participant in balances if not exists
          if (!balances[participantId]) {
            balances[participantId] = 0;
          }

          balances[participantId] -= amountPerPerson;
        });

        // If the payer is not in participants, they should also be charged their share
        if (!payerIsParticipant) {
          balances[paidBy] -= amountPerPerson;
        }
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

      const { groupId, participants, amount, paidBy } = expenseData;

      // Calculate amount per person
      const amountPerPerson = parseFloat(amount) / participants.length;

      // Create a split payment record for each participant except the payer
      const createPromises = [];

      for (const participantId of participants) {
        // Skip the payer as they don't owe themselves money
        if (participantId === paidBy) continue;

        // Create a unique ID for the split payment
        const splitPaymentId = `${expenseId}_${participantId}`;

        // Create the split payment document
        const splitPaymentData = {
          expenseId,
          groupId,
          fromUser: participantId, // The participant who owes money
          toUser: paidBy, // The person who paid and is owed money
          amount: amountPerPerson,
          status: 'pending', // Default status is pending
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Add to collection using addDoc instead of setDoc with custom ID
        const addPromise = addDoc(collection(db, 'SplitPayments'), splitPaymentData);
        createPromises.push(addPromise);
      }

      // Wait for all documents to be created
      await Promise.all(createPromises);

      console.log(`Created ${participants.length - 1} split payment records for expense ${expenseId}`);
      return true;
    } catch (error) {
      console.error('Error creating split payment records:', error);
      return false;
    }
  }
}

export default ExpenseService;
