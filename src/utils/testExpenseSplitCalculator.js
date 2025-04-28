/**
 * Test file for the Expense Split Calculator
 * 
 * This file contains test cases to verify the expense split calculator works correctly.
 */

// Import the functions directly from the implementation
const calculateExpenseSplit = (participants) => {
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    return {
      totalExpense: 0,
      individualShare: 0,
      participantCount: 0,
      participants: [],
      settlements: []
    };
  }

  // Filter only participating members
  const participatingMembers = participants.filter(p => p.isParticipating);
  
  if (participatingMembers.length === 0) {
    return {
      totalExpense: 0,
      individualShare: 0,
      participantCount: 0,
      participants: participants.map(p => ({
        ...p,
        share: 0,
        balance: p.amountPaid || 0
      })),
      settlements: []
    };
  }

  // Calculate total expense from all contributions
  const totalExpense = participatingMembers.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  
  // Calculate per-person share (total ÷ number of participants)
  const participantCount = participatingMembers.length;
  const individualShare = totalExpense / participantCount;

  // Calculate each person's balance (paid - share)
  const updatedParticipants = participants.map(p => {
    // If not participating, their share is 0 but they keep what they paid
    const share = p.isParticipating ? individualShare : 0;
    const amountPaid = p.amountPaid || 0;
    const balance = amountPaid - share;
    
    return {
      ...p,
      share,
      balance,
      amountPaid
    };
  });

  // Generate settlements between members
  const settlements = generateSettlements(updatedParticipants);

  return {
    totalExpense,
    individualShare,
    participantCount,
    participants: updatedParticipants,
    settlements
  };
};

const generateSettlements = (participants) => {
  if (!participants || !Array.isArray(participants) || participants.length < 2) {
    return [];
  }

  // Create copies of participants with positive and negative balances
  const creditors = participants
    .filter(p => p.balance > 0)
    .map(p => ({ ...p, remainingBalance: p.balance }))
    .sort((a, b) => b.remainingBalance - a.remainingBalance); // Sort descending by balance

  const debtors = participants
    .filter(p => p.balance < 0)
    .map(p => ({ ...p, remainingBalance: p.balance }))
    .sort((a, b) => a.remainingBalance - b.remainingBalance); // Sort ascending by balance (most negative first)

  const settlements = [];

  // Generate settlements until either all creditors or all debtors are settled
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0]; // Person with positive balance (to receive money)
    const debtor = debtors[0];     // Person with negative balance (to pay money)
    
    // Calculate the transfer amount (minimum of absolute values)
    const transferAmount = Math.min(
      creditor.remainingBalance,
      Math.abs(debtor.remainingBalance)
    );
    
    // Round to 2 decimal places to avoid floating point issues
    const roundedAmount = Math.round(transferAmount * 100) / 100;
    
    if (roundedAmount > 0) {
      // Create a settlement record
      settlements.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: roundedAmount,
        description: `${debtor.name} pays ₹${roundedAmount.toFixed(2)} to ${creditor.name}`
      });
      
      // Update remaining balances
      creditor.remainingBalance -= roundedAmount;
      debtor.remainingBalance += roundedAmount;
    }
    
    // Remove settled participants
    if (Math.abs(creditor.remainingBalance) < 0.01) {
      creditors.shift();
    }
    
    if (Math.abs(debtor.remainingBalance) < 0.01) {
      debtors.shift();
    }
  }

  return settlements;
};

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

// Run the tests
runAllTests();
