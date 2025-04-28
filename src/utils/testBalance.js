import ExpenseService from '../services/ExpenseService';
import GroupBalanceService from '../services/GroupBalanceService';

/**
 * Create a test expense to verify balance calculations
 */
export const createTestExpense = async () => {
  try {
    console.log('Creating test expense...');
    
    // Sample expense data
    const expenseData = {
      groupId: 'test-group-123',
      description: 'Test Expense',
      amount: 1000, // ₹1000
      category: 'Food',
      date: new Date().toISOString(),
      paidBy: 'user1',
      participants: ['user1', 'user2', 'user3'],
      notes: 'This is a test expense to verify balance calculations'
    };
    
    // Create the expense
    const expenseId = await ExpenseService.createExpense(expenseData);
    console.log('Test expense created with ID:', expenseId);
    
    // Check the balances
    const balances = await GroupBalanceService.getBalanceRecordsForGroup('test-group-123');
    console.log('Group balances after test expense:', balances);
    
    return {
      success: true,
      expenseId,
      balances
    };
  } catch (error) {
    console.error('Error creating test expense:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get balance records for a user in a group
 */
export const getBalanceRecords = async (groupId, userId) => {
  try {
    console.log(`Getting balance records for user ${userId} in group ${groupId}...`);
    
    const balances = await GroupBalanceService.getBalanceRecordsForUserInGroup(groupId, userId);
    console.log('Balance records:', balances);
    
    return {
      success: true,
      balances
    };
  } catch (error) {
    console.error('Error getting balance records:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  createTestExpense,
  getBalanceRecords
};
