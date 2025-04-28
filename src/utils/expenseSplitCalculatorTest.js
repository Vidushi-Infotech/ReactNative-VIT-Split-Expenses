/**
 * Test file for the Expense Split Calculator
 * 
 * This file contains test cases to verify the expense split calculator works correctly.
 * Run this file to test the implementation against the provided test cases.
 */

import { calculateExpenseSplit, generateSettlements } from './expenseSplitCalculator';

// Test case 1: Three participants: A paid ₹300, B paid ₹150, C paid ₹0
const testCase1 = () => {
  console.log('Test Case 1: Three participants: A paid ₹300, B paid ₹150, C paid ₹0');
  
  const participants = [
    { id: 'user1', name: 'A', amountPaid: 300, isParticipating: true },
    { id: 'user2', name: 'B', amountPaid: 150, isParticipating: true },
    { id: 'user3', name: 'C', amountPaid: 0, isParticipating: true }
  ];
  
  const result = calculateExpenseSplit(participants);
  
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
  
  console.log('Expected: C pays ₹150 to A');
  console.log('-----------------------------------');
};

// Test case 2: Three participants: A paid ₹400, B paid ₹100, C paid ₹0
const testCase2 = () => {
  console.log('Test Case 2: Three participants: A paid ₹400, B paid ₹100, C paid ₹0');
  
  const participants = [
    { id: 'user1', name: 'A', amountPaid: 400, isParticipating: true },
    { id: 'user2', name: 'B', amountPaid: 100, isParticipating: true },
    { id: 'user3', name: 'C', amountPaid: 0, isParticipating: true }
  ];
  
  const result = calculateExpenseSplit(participants);
  
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
  
  console.log('Expected: B pays ₹66.67 to A and C pays ₹166.67 to A');
  console.log('-----------------------------------');
};

// Test case 3: Two participants: A paid ₹500, B paid ₹0
const testCase3 = () => {
  console.log('Test Case 3: Two participants: A paid ₹500, B paid ₹0');
  
  const participants = [
    { id: 'user1', name: 'A', amountPaid: 500, isParticipating: true },
    { id: 'user2', name: 'B', amountPaid: 0, isParticipating: true }
  ];
  
  const result = calculateExpenseSplit(participants);
  
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
  
  console.log('Expected: B pays ₹250 to A');
  console.log('-----------------------------------');
};

// Test case 4: Two participants: A paid ₹0, B paid ₹400
const testCase4 = () => {
  console.log('Test Case 4: Two participants: A paid ₹0, B paid ₹400');
  
  const participants = [
    { id: 'user1', name: 'A', amountPaid: 0, isParticipating: true },
    { id: 'user2', name: 'B', amountPaid: 400, isParticipating: true }
  ];
  
  const result = calculateExpenseSplit(participants);
  
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
  
  console.log('Expected: A pays ₹200 to B');
  console.log('-----------------------------------');
};

// Test case 5: Three participants: A paid ₹300, B and C paid ₹0
const testCase5 = () => {
  console.log('Test Case 5: Three participants: A paid ₹300, B and C paid ₹0');
  
  const participants = [
    { id: 'user1', name: 'A', amountPaid: 300, isParticipating: true },
    { id: 'user2', name: 'B', amountPaid: 0, isParticipating: true },
    { id: 'user3', name: 'C', amountPaid: 0, isParticipating: true }
  ];
  
  const result = calculateExpenseSplit(participants);
  
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
  
  console.log('Expected: B pays ₹100 to A and C pays ₹100 to A');
  console.log('-----------------------------------');
};

// Test case 6: Four participants: A paid ₹500, B paid ₹300, C and D paid ₹0
const testCase6 = () => {
  console.log('Test Case 6: Four participants: A paid ₹500, B paid ₹300, C and D paid ₹0');
  
  const participants = [
    { id: 'user1', name: 'A', amountPaid: 500, isParticipating: true },
    { id: 'user2', name: 'B', amountPaid: 300, isParticipating: true },
    { id: 'user3', name: 'C', amountPaid: 0, isParticipating: true },
    { id: 'user4', name: 'D', amountPaid: 0, isParticipating: true }
  ];
  
  const result = calculateExpenseSplit(participants);
  
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
  
  console.log('Expected: C pays ₹100 to A and ₹100 to B, D pays ₹200 to A');
  console.log('-----------------------------------');
};

// Test case 7: Four participants: A paid ₹400, B paid ₹300, C paid ₹200, D paid ₹100
const testCase7 = () => {
  console.log('Test Case 7: Four participants: A paid ₹400, B paid ₹300, C paid ₹200, D paid ₹100');
  
  const participants = [
    { id: 'user1', name: 'A', amountPaid: 400, isParticipating: true },
    { id: 'user2', name: 'B', amountPaid: 300, isParticipating: true },
    { id: 'user3', name: 'C', amountPaid: 200, isParticipating: true },
    { id: 'user4', name: 'D', amountPaid: 100, isParticipating: true }
  ];
  
  const result = calculateExpenseSplit(participants);
  
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
  
  console.log('Expected: C pays ₹50 to B, D pays ₹150 to A');
  console.log('-----------------------------------');
};

// Run all test cases
const runAllTests = () => {
  testCase1();
  testCase2();
  testCase3();
  testCase4();
  testCase5();
  testCase6();
  testCase7();
};

// Export test functions
export default {
  runAllTests,
  testCase1,
  testCase2,
  testCase3,
  testCase4,
  testCase5,
  testCase6,
  testCase7
};
