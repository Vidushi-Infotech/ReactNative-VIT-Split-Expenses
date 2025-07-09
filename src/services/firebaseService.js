import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

class FirebaseService {
  constructor() {
    this.auth = auth();
    this.firestore = firestore();
    this.storage = storage();
  }

  // Group operations
  async createGroup(groupData) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const groupRef = this.firestore.collection('groups').doc();
      
      // Prepare members with roles
      const selectedMemberIds = groupData.members || [];
      console.log('Selected member IDs for group creation:', selectedMemberIds);
      
      // Filter and validate member IDs
      const validMemberIds = selectedMemberIds.filter(id => 
        id && typeof id === 'string' && id.trim() !== ''
      );
      console.log('Valid member IDs after filtering:', validMemberIds);
      
      // Create members array with role information
      const members = [];
      const memberRoles = {};
      
      // Add creator as admin
      members.push(user.uid);
      memberRoles[user.uid] = {
        role: 'admin',
        joinedAt: firestore.FieldValue.serverTimestamp(),
        addedBy: user.uid,
        status: 'active'
      };
      
      // Add selected members as regular members
      validMemberIds.forEach(memberId => {
        if (memberId !== user.uid && !members.includes(memberId)) {
          members.push(memberId);
          memberRoles[memberId] = {
            role: 'member',
            joinedAt: firestore.FieldValue.serverTimestamp(),
            addedBy: user.uid,
            status: 'active'
          };
        }
      });
      
      console.log('Final members array:', members);

      const group = {
        id: groupRef.id,
        name: groupData.name,
        description: groupData.description,
        coverImageUrl: groupData.coverImageUrl || null,
        members: members, // Simple array for querying
        memberRoles: memberRoles, // Detailed role information
        adminIds: [user.uid], // Quick admin lookup
        createdBy: user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        totalExpenses: 0,
        memberCount: members.length,
        isActive: true,
        currency: 'INR'
      };

      await groupRef.set(group);
      return { ...group, id: groupRef.id };
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async uploadGroupCoverImage(imageUri, groupId) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Storing group cover image locally for group:', groupId);
      console.log('Image URI:', imageUri);

      // Since we're using free Firebase, we'll store the local image URI directly
      // In a production app with billing, you would upload to Firebase Storage
      
      // For now, just return the local image URI
      return imageUri;
    } catch (error) {
      console.error('Error storing cover image:', error);
      throw error;
    }
  }

  async getUserGroups(userId) {
    try {
      // Simplified query to avoid composite index requirement
      const snapshot = await this.firestore
        .collection('groups')
        .where('members', 'array-contains', userId)
        .get();

      // Filter and sort in JavaScript to avoid composite index
      const groups = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(group => group.isActive === true)
        .sort((a, b) => {
          // Sort by updatedAt desc, handle null/undefined dates
          const aTime = a.updatedAt?.toDate?.() || new Date(0);
          const bTime = b.updatedAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });

      return groups;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw error;
    }
  }

  async updateGroup(groupId, updates) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      await this.firestore.collection('groups').doc(groupId).update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  async deleteGroup(groupId) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      await this.firestore.collection('groups').doc(groupId).update({
        isActive: false,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  async addMembersToGroup(groupId, memberUserIds) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!memberUserIds || memberUserIds.length === 0) {
        throw new Error('No members to add');
      }

      console.log('👥 Adding members to group:', { groupId, memberUserIds });

      const groupRef = this.firestore.collection('groups').doc(groupId);
      const groupDoc = await groupRef.get();
      
      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      const currentMembers = groupData.members || [];
      
      // Filter out users who are already members
      const newMembers = memberUserIds.filter(userId => !currentMembers.includes(userId));
      
      if (newMembers.length === 0) {
        console.log('👥 All selected users are already group members');
        return;
      }

      // Prepare batch updates
      const batch = this.firestore.batch();
      
      // Update group with new members
      batch.update(groupRef, {
        members: firestore.FieldValue.arrayUnion(...newMembers),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });

      // Add member roles for new members (default: member role)
      const memberRoleUpdates = {};
      newMembers.forEach(userId => {
        memberRoleUpdates[`memberRoles.${userId}`] = {
          role: 'member',
          joinedAt: firestore.FieldValue.serverTimestamp()
        };
      });

      if (Object.keys(memberRoleUpdates).length > 0) {
        batch.update(groupRef, memberRoleUpdates);
      }

      // Commit the batch
      await batch.commit();
      console.log('👥 Successfully added', newMembers.length, 'new members to group');

      return newMembers;
    } catch (error) {
      console.error('👥 Error adding members to group:', error);
      throw error;
    }
  }

  async removeMemberFromGroup(groupId, memberUserId) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!memberUserId) {
        throw new Error('No member ID provided');
      }

      console.log('🗑️ Removing member from group:', { groupId, memberUserId });

      // Check if current user is admin
      const isAdmin = await this.isGroupAdmin(groupId, user.uid);
      if (!isAdmin) {
        throw new Error('Only group admins can remove members');
      }

      const groupRef = this.firestore.collection('groups').doc(groupId);
      const groupDoc = await groupRef.get();
      
      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      const currentMembers = groupData.members || [];
      
      // Check if member is actually in the group
      if (!currentMembers.includes(memberUserId)) {
        throw new Error('User is not a member of this group');
      }

      // Prevent removing the last admin
      const memberRole = groupData.memberRoles?.[memberUserId]?.role;
      if (memberRole === 'admin') {
        const adminCount = Object.values(groupData.memberRoles || {}).filter(role => role.role === 'admin').length;
        if (adminCount <= 1) {
          throw new Error('Cannot remove the last admin from the group');
        }
      }

      // Check if member has any settled transactions
      const settlements = await this.getGroupSettlements(groupId);
      const hasSettledTransactions = settlements.some(settlement => 
        settlement.fromUserId === memberUserId || settlement.toUserId === memberUserId
      );

      console.log('🗑️ Member has settled transactions:', hasSettledTransactions);

      // Prepare batch updates
      const batch = this.firestore.batch();
      
      // Remove member from group
      batch.update(groupRef, {
        members: firestore.FieldValue.arrayRemove(memberUserId),
        [`memberRoles.${memberUserId}`]: firestore.FieldValue.delete(),
        adminIds: firestore.FieldValue.arrayRemove(memberUserId), // Remove from admin list if they were admin
        updatedAt: firestore.FieldValue.serverTimestamp()
      });

      // Recalculate expenses if member hasn't settled all their dues
      if (!hasSettledTransactions) {
        console.log('🗑️ Recalculating expenses for removed member without settlements');
        await this.recalculateExpensesAfterMemberRemoval(groupId, memberUserId, batch);
      } else {
        console.log('🗑️ Member has settlements, keeping expense history intact');
      }

      // Commit the batch
      await batch.commit();
      console.log('🗑️ Successfully removed member from group');

      return true;
    } catch (error) {
      console.error('🗑️ Error removing member from group:', error);
      throw error;
    }
  }

  // Recalculate expenses after member removal
  async recalculateExpensesAfterMemberRemoval(groupId, removedUserId, batch) {
    try {
      console.log('🧮 Recalculating expenses after member removal:', { groupId, removedUserId });

      // Get all group expenses
      const expenses = await this.getGroupExpenses(groupId);
      console.log('🧮 Found', expenses.length, 'expenses to recalculate');

      // Get current group members (before removal)
      const groupDoc = await this.firestore.collection('groups').doc(groupId).get();
      const groupData = groupDoc.data();
      const currentMembers = groupData.members || [];
      
      // Calculate remaining members after removal
      const remainingMembers = currentMembers.filter(memberId => memberId !== removedUserId);
      console.log('🧮 Remaining members after removal:', remainingMembers.length);

      if (remainingMembers.length === 0) {
        console.log('🧮 No remaining members, skipping expense recalculation');
        return;
      }

      // Process each expense
      for (const expense of expenses) {
        // Check if removed user was involved in this expense
        const wasParticipant = expense.participants.some(p => p.userId === removedUserId);
        
        if (!wasParticipant) {
          console.log('🧮 Expense', expense.id, '- removed user was not a participant, skipping');
          continue;
        }

        console.log('🧮 Processing expense:', expense.id, 'amount:', expense.amount);

        // Get the removed user's participation
        const removedUserParticipation = expense.participants.find(p => p.userId === removedUserId);
        const removedUserAmount = removedUserParticipation ? removedUserParticipation.amount : 0;

        console.log('🧮 Removed user contribution:', removedUserAmount);

        // Filter out the removed user from participants
        const remainingParticipants = expense.participants.filter(p => p.userId !== removedUserId);
        
        if (remainingParticipants.length === 0) {
          console.log('🧮 No remaining participants, skipping expense:', expense.id);
          continue;
        }

        // Recalculate split based on expense splitType
        let newParticipants = [];
        
        if (expense.splitType === 'equal') {
          // For equal split, redistribute removed user's amount equally among remaining participants
          const newAmountPerPerson = expense.amount / remainingParticipants.length;
          
          newParticipants = remainingParticipants.map(participant => ({
            ...participant,
            amount: newAmountPerPerson
          }));
          
          console.log('🧮 Equal split recalculated - new amount per person:', newAmountPerPerson);
        } else if (expense.splitType === 'percentage') {
          // For percentage split, need to recalculate percentages
          const totalRemainingPercentage = remainingParticipants.reduce((sum, p) => sum + (p.percentage || 0), 0);
          
          if (totalRemainingPercentage > 0) {
            const scaleFactor = 100 / totalRemainingPercentage;
            
            newParticipants = remainingParticipants.map(participant => {
              const newPercentage = (participant.percentage || 0) * scaleFactor;
              const newAmount = (expense.amount * newPercentage) / 100;
              return {
                ...participant,
                percentage: newPercentage,
                amount: newAmount
              };
            });
          } else {
            // Fallback to equal split if no valid percentages
            const newAmountPerPerson = expense.amount / remainingParticipants.length;
            newParticipants = remainingParticipants.map(participant => ({
              ...participant,
              percentage: 100 / remainingParticipants.length,
              amount: newAmountPerPerson
            }));
          }
          
          console.log('🧮 Percentage split recalculated');
        } else if (expense.splitType === 'shares') {
          // For shares split, redistribute based on existing shares
          const totalRemainingShares = remainingParticipants.reduce((sum, p) => sum + (p.shares || 1), 0);
          
          newParticipants = remainingParticipants.map(participant => {
            const shares = participant.shares || 1;
            const newAmount = (expense.amount * shares) / totalRemainingShares;
            return {
              ...participant,
              amount: newAmount
            };
          });
          
          console.log('🧮 Shares split recalculated');
        } else {
          // For custom/amount split, keep existing amounts but ensure they don't exceed total
          const totalRemainingAmounts = remainingParticipants.reduce((sum, p) => sum + (p.amount || 0), 0);
          
          if (totalRemainingAmounts <= expense.amount) {
            newParticipants = remainingParticipants;
          } else {
            // Scale down amounts proportionally
            const scaleFactor = expense.amount / totalRemainingAmounts;
            newParticipants = remainingParticipants.map(participant => ({
              ...participant,
              amount: (participant.amount || 0) * scaleFactor
            }));
          }
          
          console.log('🧮 Custom split recalculated');
        }

        // Update expense with new participants
        const expenseRef = this.firestore.collection('expenses').doc(expense.id);
        batch.update(expenseRef, {
          participants: newParticipants,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          recalculatedAt: firestore.FieldValue.serverTimestamp(),
          recalculatedReason: `Member removed: ${removedUserId}`
        });

        console.log('🧮 Updated expense', expense.id, 'with', newParticipants.length, 'participants');
      }

      console.log('🧮 Expense recalculation completed');
    } catch (error) {
      console.error('🧮 Error recalculating expenses after member removal:', error);
      throw error;
    }
  }

  // Group Admin Operations
  async addGroupAdmin(groupId, userId) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const groupRef = this.firestore.collection('groups').doc(groupId);
      
      await groupRef.update({
        [`memberRoles.${userId}.role`]: 'admin',
        adminIds: firestore.FieldValue.arrayUnion(userId),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding group admin:', error);
      throw error;
    }
  }

  async removeGroupAdmin(groupId, userId) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const groupRef = this.firestore.collection('groups').doc(groupId);
      
      await groupRef.update({
        [`memberRoles.${userId}.role`]: 'member',
        adminIds: firestore.FieldValue.arrayRemove(userId),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing group admin:', error);
      throw error;
    }
  }

  async isGroupAdmin(groupId, userId) {
    try {
      const groupDoc = await this.firestore.collection('groups').doc(groupId).get();
      if (!groupDoc.exists) {
        return false;
      }
      
      const groupData = groupDoc.data();
      return groupData.adminIds?.includes(userId) || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Expense operations
  async createExpense(groupId, expenseData) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const expenseRef = this.firestore.collection('expenses').doc();
      
      const expense = {
        id: expenseRef.id,
        groupId: groupId,
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        currency: expenseData.currency || 'INR',
        category: expenseData.category,
        paidBy: expenseData.paidBy.userId || user.uid,
        paidByName: expenseData.paidBy.name || user.displayName,
        splitType: expenseData.splitType,
        participants: expenseData.participants || [], // Array of {userId, amount, percentage, shares}
        receiptUrl: expenseData.receiptUrl || null,
        createdBy: user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        isActive: true
      };

      await expenseRef.set(expense);

      // Update group's total expenses
      await this.updateGroupTotalExpenses(groupId);

      return { ...expense, id: expenseRef.id };
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  async getGroupExpenses(groupId) {
    try {
      // Simplified query to avoid composite index requirement
      const snapshot = await this.firestore
        .collection('expenses')
        .where('groupId', '==', groupId)
        .get();

      // Filter and sort in JavaScript to avoid composite index
      const expenses = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(expense => expense.isActive === true)
        .sort((a, b) => {
          // Sort by createdAt desc, handle null/undefined dates
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });

      return expenses;
    } catch (error) {
      console.error('Error fetching group expenses:', error);
      throw error;
    }
  }

  async updateExpense(expenseId, updates) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      await this.firestore.collection('expenses').doc(expenseId).update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });

      // Update group's total expenses if amount changed
      if (updates.amount !== undefined) {
        const expenseDoc = await this.firestore.collection('expenses').doc(expenseId).get();
        if (expenseDoc.exists) {
          const expenseData = expenseDoc.data();
          await this.updateGroupTotalExpenses(expenseData.groupId);
        }
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get expense data before deletion to update group totals
      const expenseDoc = await this.firestore.collection('expenses').doc(expenseId).get();
      if (!expenseDoc.exists) {
        throw new Error('Expense not found');
      }
      
      const expenseData = expenseDoc.data();

      await this.firestore.collection('expenses').doc(expenseId).update({
        isActive: false,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });

      // Update group's total expenses
      await this.updateGroupTotalExpenses(expenseData.groupId);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  async updateGroupTotalExpenses(groupId) {
    try {
      // Simplified query to avoid composite index requirement
      const snapshot = await this.firestore
        .collection('expenses')
        .where('groupId', '==', groupId)
        .get();

      // Filter and calculate in JavaScript
      const totalExpenses = snapshot.docs
        .map(doc => doc.data())
        .filter(expense => expense.isActive === true)
        .reduce((sum, expense) => {
          return sum + (expense.amount || 0);
        }, 0);

      await this.firestore.collection('groups').doc(groupId).update({
        totalExpenses: totalExpenses,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating group total expenses:', error);
      throw error;
    }
  }

  async calculateGroupBalances(groupId) {
    try {
      const expenses = await this.getGroupExpenses(groupId);
      const groupDoc = await this.firestore.collection('groups').doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      const members = groupData.members || [];
      
      // Initialize balance object for each member (only current members)
      const balances = {};
      members.forEach(memberId => {
        balances[memberId] = { paid: 0, owes: 0, net: 0 };
      });

      // Calculate balances from expenses
      expenses.forEach(expense => {
        // Add to paidBy member's paid amount (only if they're still a member)
        if (balances[expense.paidBy]) {
          balances[expense.paidBy].paid += expense.amount;
        }

        // Add to each participant's owes amount (only if they're still a member)
        expense.participants.forEach(participant => {
          if (balances[participant.userId]) {
            balances[participant.userId].owes += participant.amount;
          }
        });
      });

      // Calculate net balances (positive means person is owed money, negative means they owe money)
      Object.keys(balances).forEach(memberId => {
        balances[memberId].net = balances[memberId].paid - balances[memberId].owes;
      });

      console.log('💰 Group balances calculated for', members.length, 'members:', balances);
      return balances;
    } catch (error) {
      console.error('Error calculating group balances:', error);
      throw error;
    }
  }

  // Get group members with their profile data
  async getGroupMembersWithProfiles(groupId) {
    try {
      console.log('Fetching group members for groupId:', groupId);
      
      if (!groupId || typeof groupId !== 'string') {
        throw new Error('Invalid groupId provided');
      }
      
      const groupDoc = await this.firestore.collection('groups').doc(groupId).get();
      
      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      console.log('Group data:', groupData);
      
      const memberIds = groupData.members || [];
      console.log('Member IDs:', memberIds);
      
      // Filter out invalid member IDs
      const validMemberIds = memberIds.filter(id => id && typeof id === 'string' && id.trim() !== '');
      console.log('Valid member IDs:', validMemberIds);
      
      const membersWithProfiles = await Promise.all(
        validMemberIds.map(async (memberId) => {
          try {
            console.log('Fetching profile for member:', memberId);
            const userProfile = await this.getUserProfile(memberId);
            console.log('User profile for', memberId, ':', userProfile);
            
            return {
              userId: memberId,
              id: memberId, // For compatibility
              name: userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() : 'Unknown User',
              displayName: userProfile?.displayName || 'Unknown User',
              avatar: userProfile?.profileImageUrl || null,
              email: userProfile?.email || '',
              phoneNumber: userProfile?.phoneNumber || '',
              isYou: memberId === this.auth.currentUser?.uid,
              role: groupData.memberRoles?.[memberId]?.role || 'member'
            };
          } catch (memberError) {
            console.error('Error fetching profile for member:', memberId, memberError);
            // Return a fallback member object
            return {
              userId: memberId,
              id: memberId,
              name: 'Unknown User',
              displayName: 'Unknown User',
              avatar: null,
              email: '',
              phoneNumber: '',
              isYou: memberId === this.auth.currentUser?.uid,
              role: groupData.memberRoles?.[memberId]?.role || 'member'
            };
          }
        })
      );

      console.log('Final members with profiles:', membersWithProfiles);
      return membersWithProfiles;
    } catch (error) {
      console.error('Error fetching group members with profiles:', error);
      throw error;
    }
  }

  // User operations
  async updateUserProfile(userData) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Firebase Service: Updating profile for user:', user.uid);
      console.log('Firebase Service: User data to update:', userData);

      await this.firestore.collection('users').doc(user.uid).set({
        ...userData,
        updatedAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log('Firebase Service: Profile update successful');
    } catch (error) {
      console.error('Firebase Service: Error updating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      console.log('Getting user profile for userId:', userId, 'type:', typeof userId);
      
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.error('Invalid userId provided to getUserProfile:', userId);
        return null;
      }
      
      const doc = await this.firestore.collection('users').doc(userId.trim()).get();
      const result = doc.exists ? { id: doc.id, ...doc.data() } : null;
      console.log('User profile result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching user profile for userId:', userId, error);
      throw error;
    }
  }

  async findUserByPhone(phoneNumber) {
    try {
      console.log('Looking up user by phone:', phoneNumber);
      
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return null;
      }
      
      const snapshot = await this.firestore
        .collection('users')
        .where('phoneNumber', '==', phoneNumber.trim())
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, uid: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      console.log('Error finding user by phone:', phoneNumber, error.message);
      return null;
    }
  }

  async findUserByEmail(email) {
    try {
      console.log('Looking up user by email:', email);
      
      if (!email || typeof email !== 'string') {
        return null;
      }
      
      const snapshot = await this.firestore
        .collection('users')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, uid: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      console.log('Error finding user by email:', email, error.message);
      return null;
    }
  }

  async uploadProfileImage(imageUri, userId) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Storing profile image locally for user:', userId);
      console.log('Image URI:', imageUri);

      // Since we're using free Firebase, we'll store the local image URI directly
      // In a production app with billing, you would upload to Firebase Storage
      
      // For now, just return the local image URI
      // You can copy selected images to app's local storage if needed
      return imageUri;
    } catch (error) {
      console.error('Error storing profile image:', error);
      throw error;
    }
  }

  // Calculate overall balance across all user's groups
  async calculateOverallBalance(userId) {
    try {
      console.log('📊 Calculating overall balance for user:', userId);
      
      // Get all user's groups
      const userGroups = await this.getUserGroups(userId);
      console.log('📊 Found', userGroups.length, 'groups for balance calculation');
      
      let totalYouOwe = 0;
      let totalYouAreOwed = 0;
      let groupBalanceDetails = [];

      // Calculate balance for each group
      for (const group of userGroups) {
        try {
          const groupBalances = await this.calculateGroupBalances(group.id);
          const userBalance = groupBalances[userId];
          
          if (userBalance) {
            const netBalance = userBalance.net;
            
            if (netBalance > 0) {
              // User is owed money
              totalYouAreOwed += netBalance;
              groupBalanceDetails.push({
                groupId: group.id,
                groupName: group.name,
                type: 'owed',
                amount: netBalance
              });
            } else if (netBalance < 0) {
              // User owes money
              totalYouOwe += Math.abs(netBalance);
              groupBalanceDetails.push({
                groupId: group.id,
                groupName: group.name,
                type: 'owe',
                amount: Math.abs(netBalance)
              });
            }
          }
        } catch (groupError) {
          console.error('📊 Error calculating balance for group:', group.id, groupError);
          // Continue with other groups
        }
      }

      const netBalance = totalYouAreOwed - totalYouOwe;
      
      const overallBalance = {
        netBalance,
        totalYouOwe,
        totalYouAreOwed,
        groupBalanceDetails
      };
      
      console.log('📊 Overall balance calculated:', overallBalance);
      return overallBalance;
    } catch (error) {
      console.error('📊 Error calculating overall balance:', error);
      throw error;
    }
  }

  // Get group balances with group details for UI
  async getGroupBalancesWithDetails(userId) {
    try {
      console.log('📊 Getting group balances with details for user:', userId);
      
      const userGroups = await this.getUserGroups(userId);
      const groupBalances = [];

      for (const group of userGroups) {
        try {
          const balances = await this.calculateGroupBalances(group.id);
          const userBalance = balances[userId];
          
          if (userBalance) {
            groupBalances.push({
              groupId: group.id,
              groupName: group.name,
              coverImageUrl: group.coverImageUrl,
              youOwe: userBalance.net < 0 ? Math.abs(userBalance.net) : 0,
              youAreOwed: userBalance.net > 0 ? userBalance.net : 0,
              netBalance: userBalance.net,
              totalExpenses: group.totalExpenses || 0
            });
          }
        } catch (groupError) {
          console.error('📊 Error getting balance for group:', group.id, groupError);
          // Add group with zero balance if error occurs
          groupBalances.push({
            groupId: group.id,
            groupName: group.name,
            coverImageUrl: group.coverImageUrl,
            youOwe: 0,
            youAreOwed: 0,
            netBalance: 0,
            totalExpenses: group.totalExpenses || 0
          });
        }
      }

      console.log('📊 Group balances with details:', groupBalances);
      return groupBalances;
    } catch (error) {
      console.error('📊 Error getting group balances with details:', error);
      throw error;
    }
  }

  // Settlement operations
  async createSettlement(groupId, settlementData) {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('💳 Creating settlement:', settlementData);

      const settlementRef = this.firestore.collection('settlements').doc();
      
      const settlement = {
        id: settlementRef.id,
        groupId: groupId,
        fromUserId: settlementData.fromUserId,
        toUserId: settlementData.toUserId,
        amount: parseFloat(settlementData.amount),
        currency: settlementData.currency || 'INR',
        description: settlementData.description || `Settlement between users`,
        status: 'settled',
        settledBy: user.uid,
        settledAt: firestore.FieldValue.serverTimestamp(),
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        isActive: true
      };

      await settlementRef.set(settlement);
      console.log('💳 Settlement saved to database:', settlement);

      return { ...settlement, id: settlementRef.id };
    } catch (error) {
      console.error('💳 Error creating settlement:', error);
      throw error;
    }
  }

  async getGroupSettlements(groupId) {
    try {
      console.log('💳 Fetching settlements for group:', groupId);
      
      const snapshot = await this.firestore
        .collection('settlements')
        .where('groupId', '==', groupId)
        .where('isActive', '==', true)
        .get();

      const settlements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('💳 Found', settlements.length, 'settlements for group');
      return settlements;
    } catch (error) {
      console.error('💳 Error fetching group settlements:', error);
      throw error;
    }
  }

  // Calculate settlements with settled transaction awareness
  async calculateGroupSettlements(groupId) {
    try {
      console.log('🧮 Calculating group settlements for:', groupId);
      
      // Get current balances and existing settlements
      const [balances, existingSettlements] = await Promise.all([
        this.calculateGroupBalances(groupId),
        this.getGroupSettlements(groupId)
      ]);

      console.log('🧮 Balances:', balances);
      console.log('🧮 Existing settlements:', existingSettlements);

      // Create a map of settled amounts between users
      const settledAmounts = {};
      existingSettlements.forEach(settlement => {
        const key = `${settlement.fromUserId}-${settlement.toUserId}`;
        settledAmounts[key] = (settledAmounts[key] || 0) + settlement.amount;
      });

      console.log('🧮 Settled amounts:', settledAmounts);

      // Calculate pending settlements
      const pendingSettlements = [];
      Object.entries(balances).forEach(([userId, balance]) => {
        if (balance.net < 0) {
          // This user owes money
          Object.entries(balances).forEach(([creditorId, creditorBalance]) => {
            if (creditorId !== userId && creditorBalance.net > 0) {
              const settleAmount = Math.min(Math.abs(balance.net), creditorBalance.net);
              
              // Check how much has already been settled between these users
              const settledKey = `${userId}-${creditorId}`;
              const alreadySettled = settledAmounts[settledKey] || 0;
              const remainingAmount = settleAmount - alreadySettled;
              
              if (remainingAmount > 0) {
                pendingSettlements.push({
                  id: `pending-${userId}-${creditorId}`,
                  fromUserId: userId,
                  toUserId: creditorId,
                  amount: remainingAmount,
                  type: 'pending'
                });
              }
            }
          });
        }
      });

      console.log('🧮 Pending settlements:', pendingSettlements);
      return {
        pendingSettlements,
        settledTransactions: existingSettlements
      };
    } catch (error) {
      console.error('🧮 Error calculating group settlements:', error);
      throw error;
    }
  }
}

export default new FirebaseService();