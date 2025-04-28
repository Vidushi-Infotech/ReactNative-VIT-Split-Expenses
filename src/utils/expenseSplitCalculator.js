/**
 * Expense Split Calculator
 *
 * This utility provides functions for calculating expense splits and generating
 * optimal settlement plans between group members.
 */

/**
 * Calculate expense split among participants
 *
 * @param {Array} participants - Array of participants with their paid amounts and participation status
 *   Each participant object should have: { id, name, amountPaid, isParticipating }
 * @returns {Object} Split calculation result with individual shares and balances
 */
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

/**
 * Generate optimal settlements between members with negative and positive balances
 *
 * @param {Array} participants - Array of participants with calculated balances
 * @returns {Array} Array of settlement objects { fromId, toId, amount, description }
 */
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

module.exports = {
  calculateExpenseSplit,
  generateSettlements
};
