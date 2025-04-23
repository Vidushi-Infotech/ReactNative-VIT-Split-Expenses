// Mock data for the app

// Current user (you)
export const currentUser = {
  id: 'current',
  username: 'currentuser',
  email: 'current@example.com',
  name: 'Current User',
  avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
};

// Mock Users
export const mockUsers = [
  {
    id: 'user1',
    username: 'johndoe',
    email: 'john@example.com',
    name: 'John Doe',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 'user2',
    username: 'janedoe',
    email: 'jane@example.com',
    name: 'Jane Doe',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    id: 'user3',
    username: 'mikebrown',
    email: 'mike@example.com',
    name: 'Mike Brown',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
  {
    id: 'user4',
    username: 'sarahsmith',
    email: 'sarah@example.com',
    name: 'Sarah Smith',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: 'user5',
    username: 'alexjones',
    email: 'alex@example.com',
    name: 'Alex Jones',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
];

// Mock Groups
export const mockGroups = [
  {
    id: 'group1',
    name: 'Trip to Paris',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    members: [currentUser, mockUsers[0], mockUsers[1]],
    createdBy: currentUser.id,
    createdAt: '2023-04-15T10:30:00Z',
  },
  {
    id: 'group2',
    name: 'Roommates',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
    members: [currentUser, mockUsers[2], mockUsers[3]],
    createdBy: mockUsers[2].id,
    createdAt: '2023-03-10T14:20:00Z',
  },
  {
    id: 'group3',
    name: 'Dinner Club',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
    members: [currentUser, mockUsers[0], mockUsers[3], mockUsers[4]],
    createdBy: currentUser.id,
    createdAt: '2023-05-05T19:45:00Z',
  },
  {
    id: 'group4',
    name: 'Weekend Getaway',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077',
    members: [currentUser, mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4]],
    createdBy: mockUsers[3].id,
    createdAt: '2023-06-01T12:00:00Z',
  },
  
];

// Mock Expenses
export const mockExpenses = [
  {
    id: 'expense1',
    groupId: 'group1',
    amount: 120.50,
    description: 'Eiffel Tower tickets',
    paidBy: currentUser.id,
    date: '2023-04-16T14:30:00Z',
    participants: [currentUser.id, mockUsers[0].id, mockUsers[1].id],
    category: 'Entertainment',
  },
  {
    id: 'expense2',
    groupId: 'group1',
    amount: 85.75,
    description: 'Dinner at Le Bistro',
    paidBy: mockUsers[0].id,
    date: '2023-04-17T20:15:00Z',
    participants: [currentUser.id, mockUsers[0].id, mockUsers[1].id],
    category: 'Food',
  },
  {
    id: 'expense3',
    groupId: 'group2',
    amount: 200,
    description: 'Electricity bill',
    paidBy: mockUsers[2].id,
    date: '2023-03-15T09:00:00Z',
    participants: [currentUser.id, mockUsers[2].id, mockUsers[3].id],
    category: 'Utilities',
  },
  {
    id: 'expense4',
    groupId: 'group3',
    amount: 150.25,
    description: 'Dinner at Italian restaurant',
    paidBy: currentUser.id,
    date: '2023-05-10T19:30:00Z',
    participants: [currentUser.id, mockUsers[0].id, mockUsers[3].id, mockUsers[4].id],
    category: 'Food',
  },
];

// Mock Payments
export const mockPayments = [
  {
    id: 'payment1',
    groupId: 'group1',
    fromUser: mockUsers[0].id,
    toUser: currentUser.id,
    amount: 40.17,
    date: '2023-04-18T10:30:00Z',
    status: 'completed',
  },
  {
    id: 'payment2',
    groupId: 'group1',
    fromUser: mockUsers[1].id,
    toUser: currentUser.id,
    amount: 40.17,
    date: '2023-04-19T15:45:00Z',
    status: 'pending',
  },
  {
    id: 'payment3',
    groupId: 'group2',
    fromUser: currentUser.id,
    toUser: mockUsers[2].id,
    amount: 66.67,
    date: '2023-03-20T11:15:00Z',
    status: 'completed',
  },
];

// Mock Notifications
export const mockNotifications = [
  {
    id: 'notif1',
    type: 'expense_added',
    title: 'New expense added',
    message: 'John Doe added "Dinner at Le Bistro" expense in Trip to Paris',
    date: '2023-04-17T20:20:00Z',
    read: false,
    data: { expenseId: 'expense2', groupId: 'group1' },
  },
  {
    id: 'notif2',
    type: 'payment_reminder',
    title: 'Payment reminder',
    message: 'You need to pay Mike Brown $66.67 for Electricity bill',
    date: '2023-03-18T09:30:00Z',
    read: true,
    data: { paymentId: 'payment3', groupId: 'group2' },
  },
  {
    id: 'notif3',
    type: 'group_invite',
    title: 'Group invitation',
    message: 'Sarah Smith invited you to join "Weekend Getaway"',
    date: '2023-05-01T14:10:00Z',
    read: false,
    data: { groupId: 'new-group', invitedBy: 'user4' },
  },
  {
    id: 'notif4',
    type: 'payment_received',
    title: 'Payment received',
    message: 'John Doe paid you $40.17',
    date: '2023-04-18T10:35:00Z',
    read: true,
    data: { paymentId: 'payment1', groupId: 'group1' },
  },
];

// Categories for expenses
export const expenseCategories = [
  'Food',
  'Transportation',
  'Accommodation',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Other',
];

// Helper function to get user by ID
export const getUserById = (userId) => {
  if (!userId) {
    console.warn('getUserById called with undefined or null userId');
    return currentUser;
  }

  try {
    if (userId === currentUser.id) return currentUser;
    const user = mockUsers.find(u => u.id === userId);
    return user || currentUser;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return currentUser;
  }
};

// Helper function to get group by ID
export const getGroupById = (groupId) => {
  if (!groupId) {
    console.warn('getGroupById called with undefined or null groupId');
    return null;
  }

  try {
    console.log('Looking for group with ID:', groupId);
    console.log('Available group IDs:', mockGroups.map(g => g.id));
    const group = mockGroups.find(g => g.id === groupId);
    console.log('Found group:', group ? 'Yes' : 'No');
    return group;
  } catch (error) {
    console.error('Error in getGroupById:', error);
    return null;
  }
};

// Helper function to get expenses by group ID
export const getExpensesByGroupId = (groupId) => {
  if (!groupId) {
    console.warn('getExpensesByGroupId called with undefined or null groupId');
    return [];
  }

  try {
    return mockExpenses.filter(e => e.groupId === groupId);
  } catch (error) {
    console.error('Error in getExpensesByGroupId:', error);
    return [];
  }
};

// Helper function to get payments by group ID
export const getPaymentsByGroupId = (groupId) => {
  if (!groupId) {
    console.warn('getPaymentsByGroupId called with undefined or null groupId');
    return [];
  }

  try {
    return mockPayments.filter(p => p.groupId === groupId);
  } catch (error) {
    console.error('Error in getPaymentsByGroupId:', error);
    return [];
  }
};

// Helper function to calculate balances in a group
export const calculateGroupBalances = (groupId) => {
  if (!groupId) {
    console.warn('calculateGroupBalances called with undefined or null groupId');
    return {};
  }

  try {
    const expenses = getExpensesByGroupId(groupId);
    const balances = {};
    const group = getGroupById(groupId);

    if (!group) return {};

    // Initialize balances for all members
    group.members.forEach(member => {
      balances[member.id] = 0;
    });

    // Calculate balances based on expenses
    expenses.forEach(expense => {
      const paidBy = expense.paidBy;
      const participants = expense.participants;
      const amountPerPerson = expense.amount / participants.length;

      // Add the full amount to the person who paid
      balances[paidBy] += expense.amount;

      // Subtract each participant's share
      participants.forEach(participantId => {
        balances[participantId] -= amountPerPerson;
      });
    });

    // Adjust balances based on payments
    const payments = getPaymentsByGroupId(groupId);
    payments.forEach(payment => {
      if (payment.status === 'completed') {
        balances[payment.fromUser] += payment.amount;
        balances[payment.toUser] -= payment.amount;
      }
    });

    return balances;
  } catch (error) {
    console.error('Error in calculateGroupBalances:', error);
    return {};
  }
};
