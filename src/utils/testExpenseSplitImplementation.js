/**
 * Test file for the expense split implementation
 * 
 * This file tests the integration of the expense split calculator with the services.
 */

const expenseSplitCalculator = require('./expenseSplitCalculator');

// Test case: Four participants: A paid ₹400, B paid ₹300, C paid ₹200, D paid ₹100
const testExpenseSplit = () => {
  console.log('Testing expense split calculation:');
  
  const participants = [
    { id: 'user1', name: 'A', amountPaid: 400, isParticipating: true },
    { id: 'user2', name: 'B', amountPaid: 300, isParticipating: true },
    { id: 'user3', name: 'C', amountPaid: 200, isParticipating: true },
    { id: 'user4', name: 'D', amountPaid: 100, isParticipating: true }
  ];
  
  const result = expenseSplitCalculator.calculateExpenseSplit(participants);
  
  console.log('Total Expense:', result.totalExpense);
  console.log('Individual Share:', result.individualShare);
  console.log('Participant Balances:');
  result.participants.forEach(p => {
    console.log(`${p.name}: ${p.balance.toFixed(2)}`);
  });
  
  console.log('Settlements:');
  result.settlements.forEach(s => {
    console.log(s.description);
  });
  
  return result;
};

// Run the test
const result = testExpenseSplit();
console.log('\nTest completed successfully!');
