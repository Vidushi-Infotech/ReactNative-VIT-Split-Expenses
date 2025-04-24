import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

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
      // Add the expense to Firestore
      const docRef = await addDoc(collection(db, 'Expenses'), {
        ...expenseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log('Expense created with ID:', docRef.id);
      return docRef.id;
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
}

export default ExpenseService;
