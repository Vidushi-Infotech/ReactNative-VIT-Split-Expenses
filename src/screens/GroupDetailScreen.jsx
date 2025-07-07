import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import firebaseService from '../services/firebaseService';

const GroupDetailScreen = ({ route, navigation }) => {
  const { group } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Expenses');
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const [showManageGroup, setShowManageGroup] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [settlements, setSettlements] = useState({ pending: [], settled: [] });


  const calculateSettlements = () => {
    const settlements = [];
    const memberBalanceList = Object.entries(balances).map(([userId, balance]) => {
      const member = groupMembers.find(m => m.userId === userId);
      return { userId, member, balance };
    }).filter(item => item.member);

    // Find who owes money (negative balance) and who should receive money (positive balance)
    const debtors = memberBalanceList.filter(item => item.balance.net < 0);
    const creditors = memberBalanceList.filter(item => item.balance.net > 0);

    // Simple settlement calculation
    debtors.forEach(debtor => {
      let remainingDebt = Math.abs(debtor.balance.net);
      
      creditors.forEach(creditor => {
        if (remainingDebt > 0 && creditor.balance.net > 0) {
          const settleAmount = Math.min(remainingDebt, creditor.balance.net);
          
          settlements.push({
            id: `${debtor.userId}-${creditor.userId}`,
            fromUserId: debtor.userId,
            toUserId: creditor.userId,
            from: debtor.member.name + (debtor.userId === user?.uid ? ' (You)' : ''),
            to: creditor.member.name + (creditor.userId === user?.uid ? ' (You)' : ''),
            amount: settleAmount,
            avatar: debtor.member.avatar
          });
          
          remainingDebt -= settleAmount;
          creditor.balance.net -= settleAmount;
        }
      });
    });

    return settlements;
  };

  // Category mapping for display
  const categoryMapping = {
    '1': { emoji: '🍽️', color: '#FEF3C7' },
    '2': { emoji: '🚗', color: '#FECACA' },
    '3': { emoji: '🛍️', color: '#E0E7FF' },
    '4': { emoji: '🍺', color: '#FED7AA' },
    '5': { emoji: '🎬', color: '#F3E8FF' },
    '6': { emoji: '🏥', color: '#FECACA' },
    '7': { emoji: '📝', color: '#F3F4F6' },
    default: { emoji: '💰', color: '#F3F4F6' }
  };

  useEffect(() => {
    loadGroupData();
  }, [group]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadGroupExpenses(),
        loadGroupMembers(),
        loadGroupBalances(),
        loadGroupSettlements()
      ]);
    } catch (error) {
      console.error('Error loading group data:', error);
      Alert.alert('Error', 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupExpenses = async () => {
    try {
      const groupExpenses = await firebaseService.getGroupExpenses(group.id);
      console.log('Loaded expenses:', groupExpenses);
      setExpenses(groupExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadGroupMembers = async () => {
    try {
      console.log('👥 Loading group members for group:', group.id);
      const members = await firebaseService.getGroupMembersWithProfiles(group.id);
      console.log('👥 Loaded group members:', members.map(m => ({ userId: m.userId, name: m.name, displayName: m.displayName })));
      setGroupMembers(members);
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const loadGroupBalances = async () => {
    try {
      const groupBalances = await firebaseService.calculateGroupBalances(group.id);
      setBalances(groupBalances);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const loadGroupSettlements = async () => {
    try {
      console.log('💳 Loading settlements for group:', group.id);
      const settlementData = await firebaseService.calculateGroupSettlements(group.id);
      console.log('💳 Loaded settlement data:', settlementData);
      setSettlements(settlementData);
    } catch (error) {
      console.error('💳 Error loading settlements:', error);
      // If settlements collection is not accessible due to permission issues,
      // fall back to calculating settlements from balances
      if (error.code === 'firestore/permission-denied') {
        console.log('💳 Falling back to local settlement calculation due to permission issues');
        setSettlements({ pendingSettlements: [], settledTransactions: [] });
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadGroupData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGroupOptions = () => {
    setShowGroupOptions(true);
  };

  const handleManageGroup = () => {
    setShowGroupOptions(false);
    navigation.navigate('ManageGroup', { group });
  };

  const handleDeleteGroup = () => {
    setShowGroupOptions(false);
    // Handle delete group
    console.log('Delete group');
  };

  const handleLeaveGroup = () => {
    setShowGroupOptions(false);
    // Handle leave group
    console.log('Leave group');
  };

  const renderExpenses = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Ionicons name="receipt" size={48} color="#9CA3AF" />
          <Text style={styles.noDataText}>No expenses yet</Text>
          <Text style={styles.noDataSubtext}>Add your first expense to get started</Text>
        </View>
      ) : (
        expenses.map((expense) => {
          const category = categoryMapping[expense.category?.id] || categoryMapping.default;
          const yourShare = expense.participants?.find(p => p.userId === user?.uid)?.amount || 0;
          const expenseDate = expense.createdAt?.toDate ? 
            expense.createdAt.toDate().toLocaleDateString() : 'Recent';
          
          return (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={[styles.expenseIcon, { backgroundColor: category.color }]}>
                <Text style={styles.expenseIconText}>{category.emoji}</Text>
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseTitle}>{expense.description}</Text>
                <Text style={styles.expenseSubtitle}>
                  Paid by {expense.paidBy === user?.uid ? 'You' : expense.paidByName}
                </Text>
                <Text style={styles.expenseDate}>{expenseDate}</Text>
              </View>
              <View style={styles.expenseAmounts}>
                <Text style={styles.expenseAmount}>₹{expense.amount.toFixed(0)}</Text>
                <Text style={styles.expenseShare}>₹{yourShare.toFixed(0)}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const toggleUserExpansion = (userId) => {
    console.log('🔄 Toggling expansion for user:', userId);
    console.log('📊 Current expanded state:', expandedUsers[userId]);
    
    setExpandedUsers(prev => {
      const newState = {
        ...prev,
        [userId]: !prev[userId]
      };
      console.log('📊 New expanded state:', newState);
      return newState;
    });
  };

  const getBalanceBreakdown = (targetUserId) => {
    console.log('🔍 Getting breakdown for user:', targetUserId);
    console.log('📊 Available balances:', balances);
    
    const breakdown = [];
    
    // Get all group expenses and calculate detailed breakdown
    Object.entries(balances).forEach(([userId, balance]) => {
      if (userId === targetUserId || balance.net === 0) return;
      
      const member = groupMembers.find(m => m.userId === userId);
      if (!member) return;
      
      const targetMember = groupMembers.find(m => m.userId === targetUserId);
      if (!targetMember) return;
      
      // Calculate the settlement between these two users
      const targetBalance = balances[targetUserId];
      if (!targetBalance) return;
      
      // If target user has negative balance and this user has positive balance
      if (targetBalance.net < 0 && balance.net > 0) {
        const settleAmount = Math.min(Math.abs(targetBalance.net), balance.net);
        if (settleAmount > 0) {
          breakdown.push({
            type: 'owes',
            text: `${targetMember.name}${targetUserId === user?.uid ? ' (You)' : ''} owes ₹${settleAmount.toFixed(0)} to ${member.name}${userId === user?.uid ? ' (You)' : ''}`,
            amount: settleAmount,
            fromUser: targetMember.name,
            toUser: member.name,
            avatar: member.avatar
          });
        }
      }
      // If target user has positive balance and this user has negative balance  
      else if (targetBalance.net > 0 && balance.net < 0) {
        const settleAmount = Math.min(targetBalance.net, Math.abs(balance.net));
        if (settleAmount > 0) {
          breakdown.push({
            type: 'owed',
            text: `${member.name}${userId === user?.uid ? ' (You)' : ''} owes ₹${settleAmount.toFixed(0)} to ${targetMember.name}${targetUserId === user?.uid ? ' (You)' : ''}`,
            amount: settleAmount,
            fromUser: member.name,
            toUser: targetMember.name,
            avatar: member.avatar
          });
        }
      }
      
    });
    
    console.log('📋 Breakdown result:', breakdown);
    return breakdown;
  };

  const renderBalance = () => {
    const balanceList = Object.entries(balances).map(([userId, balance]) => {
      const member = groupMembers.find(m => m.userId === userId);
      if (!member) return null;
      
      return {
        userId,
        member,
        balance,
        isYou: userId === user?.uid
      };
    }).filter(Boolean);

    return (
      <ScrollView 
        style={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading balances...</Text>
          </View>
        ) : balanceList.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="wallet" size={48} color="#9CA3AF" />
            <Text style={styles.noDataText}>No balances yet</Text>
            <Text style={styles.noDataSubtext}>Add expenses to see balances</Text>
          </View>
        ) : (
          balanceList.map((item) => {
            const isExpanded = expandedUsers[item.userId];
            const breakdown = getBalanceBreakdown(item.userId);
            const totalAmount = Math.abs(item.balance.net);
            
            return (
              <View key={item.userId} style={styles.balanceSection}>
                <TouchableOpacity 
                  style={styles.balanceHeader}
                  onPress={() => toggleUserExpansion(item.userId)}
                  disabled={breakdown.length === 0}
                >
                  {item.member.avatar ? (
                    <Image source={{ uri: item.member.avatar }} style={styles.balanceAvatar} />
                  ) : (
                    <View style={styles.balanceAvatarPlaceholder}>
                      <Text style={styles.balanceAvatarText}>
                        {item.member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceName}>
                      {item.member.name}{item.isYou ? ' (You)' : ''} {item.balance.net < 0 ? 'owes in total' : 'gets back in total'}
                    </Text>
                  </View>
                  <View style={styles.balanceAmountContainer}>
                    <Text style={[
                      styles.balanceAmount,
                      { color: item.balance.net >= 0 ? '#10B981' : '#EF4444' }
                    ]}>
                      ₹{totalAmount.toFixed(0)}
                    </Text>
                    {breakdown.length > 0 && (
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#6B7280" 
                        style={styles.expandIcon}
                      />
                    )}
                  </View>
                </TouchableOpacity>
                
                {isExpanded && breakdown.length > 0 && (
                  <View style={styles.breakdownContainer}>
                    {breakdown.map((breakdownItem, index) => (
                      <View key={index} style={styles.breakdownItem}>
                        {breakdownItem.avatar ? (
                          <Image source={{ uri: breakdownItem.avatar }} style={styles.breakdownAvatar} />
                        ) : (
                          <View style={styles.breakdownAvatarPlaceholder}>
                            <Text style={styles.breakdownAvatarText}>
                              {(breakdownItem.fromUser || breakdownItem.toUser || 'U').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.breakdownText}>{breakdownItem.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    );
  };

  const handleSettleUp = async (settlement) => {
    console.log('💳 Settling up:', settlement);
    
    try {
      // Save settlement to Firebase
      await firebaseService.createSettlement(group.id, {
        fromUserId: settlement.fromUserId,
        toUserId: settlement.toUserId,
        amount: settlement.amount,
        description: `Settlement between ${settlement.from} and ${settlement.to}`
      });
      
      // Reload settlements to get updated data
      await loadGroupSettlements();
      
      // Show success message
      Alert.alert(
        'Settlement Confirmed',
        `Payment of ₹${settlement.amount.toFixed(0)} from ${settlement.from} to ${settlement.to} has been marked as settled.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('💳 Error settling up:', error);
      if (error.code === 'firestore/permission-denied') {
        Alert.alert(
          'Permission Error', 
          'Cannot save settlement to database due to permission issues. Please update Firebase Security Rules to allow settlements collection access.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to record settlement. Please try again.');
      }
    }
  };

  const createSettlementList = () => {
    console.log('🔍 Creating settlement list...');
    console.log('💳 Available settlements from Firebase:', settlements);
    console.log('📊 Available balances:', balances);
    console.log('👥 Group members loaded:', groupMembers.length, 'members');
    console.log('👥 Group members details:', groupMembers.map(m => ({ userId: m.userId, name: m.name, displayName: m.displayName })));
    
    // If we have Firebase settlements data, use it
    if (settlements.pendingSettlements && settlements.pendingSettlements.length > 0) {
      const pendingSettlements = settlements.pendingSettlements.map(settlement => {
        const fromMember = groupMembers.find(m => m.userId === settlement.fromUserId);
        const toMember = groupMembers.find(m => m.userId === settlement.toUserId);
        
        console.log('🔍 Settlement member lookup:', {
          fromUserId: settlement.fromUserId,
          toUserId: settlement.toUserId,
          fromMember: fromMember ? fromMember.name : 'Not found',
          toMember: toMember ? toMember.name : 'Not found',
          allMembers: groupMembers.map(m => ({ userId: m.userId, name: m.name }))
        });
        
        // Create settlement even if member not found, with fallback names
        return {
          id: settlement.id,
          fromUserId: settlement.fromUserId,
          toUserId: settlement.toUserId,
          from: (fromMember?.name || 'Unknown User') + (settlement.fromUserId === user?.uid ? ' (You)' : ''),
          to: (toMember?.name || 'Unknown User') + (settlement.toUserId === user?.uid ? ' (You)' : ''),
          amount: settlement.amount,
          fromMember: fromMember || { userId: settlement.fromUserId, name: 'Unknown User', avatar: null },
          toMember: toMember || { userId: settlement.toUserId, name: 'Unknown User', avatar: null }
        };
      });
      
      console.log('📋 Using Firebase pending settlements:', pendingSettlements);
      return pendingSettlements;
    }
    
    // Fall back to calculating settlements from balances if Firebase data is not available
    console.log('📋 Falling back to balance-based settlement calculation');
    const calculatedSettlements = [];
    
    Object.entries(balances).forEach(([userId, balance]) => {
      const member = groupMembers.find(m => m.userId === userId);
      if (!member || balance.net === 0) return;
      
      if (balance.net < 0) {
        Object.entries(balances).forEach(([creditorId, creditorBalance]) => {
          if (creditorId !== userId && creditorBalance.net > 0) {
            const creditorMember = groupMembers.find(m => m.userId === creditorId);
            const settleAmount = Math.min(Math.abs(balance.net), creditorBalance.net);
            if (settleAmount > 0) {
              calculatedSettlements.push({
                id: `${userId}-${creditorId}`,
                fromUserId: userId,
                toUserId: creditorId,
                from: (member?.name || 'Unknown User') + (userId === user?.uid ? ' (You)' : ''),
                to: (creditorMember?.name || 'Unknown User') + (creditorId === user?.uid ? ' (You)' : ''),
                amount: settleAmount,
                fromMember: member || { userId: userId, name: 'Unknown User', avatar: null },
                toMember: creditorMember || { userId: creditorId, name: 'Unknown User', avatar: null }
              });
            }
          }
        });
      }
    });
    
    console.log('📋 Calculated settlements from balances:', calculatedSettlements);
    return calculatedSettlements;
  };

  const renderSettlement = () => {
    // Don't create settlement list if group members haven't loaded yet
    if (loading || groupMembers.length === 0) {
      return (
        <ScrollView style={styles.tabContent}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading settlements...</Text>
          </View>
        </ScrollView>
      );
    }
    
    const pendingSettlements = createSettlementList();
    
    console.log('⏳ Pending settlements with details:', pendingSettlements.map(s => ({
      id: s.id,
      fromMember: s.fromMember?.name,
      toMember: s.toMember?.name,
      amount: s.amount
    })));
    
    return (
      <ScrollView 
        style={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading settlements...</Text>
          </View>
        ) : pendingSettlements.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.noDataText}>All settled up!</Text>
            <Text style={styles.noDataSubtext}>No pending settlements</Text>
          </View>
        ) : (
          pendingSettlements.map((settlement) => {
            const isYouOwe = settlement.fromUserId === user?.uid;
            const avatarMember = isYouOwe ? settlement.toMember : settlement.fromMember;
            
            return (
              <View key={settlement.id} style={styles.settlementItem}>
                {avatarMember?.avatar ? (
                  <Image source={{ uri: avatarMember.avatar }} style={styles.settlementAvatar} />
                ) : (
                  <View style={styles.settlementAvatarPlaceholder}>
                    <Text style={styles.settlementAvatarText}>
                      {avatarMember?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.settlementDetails}>
                  <Text style={styles.settlementText}>
                    {isYouOwe ? (
                      <>
                        You owes <Text style={styles.settlementAmount}>₹{settlement.amount.toFixed(0)}</Text> to {settlement.toMember?.name || 'Unknown User'}
                      </>
                    ) : (
                      <>
                        {settlement.fromMember?.name || 'Unknown User'} owes you <Text style={styles.settlementAmountGreen}>₹{settlement.amount.toFixed(0)}</Text>
                      </>
                    )}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.settleButton}
                  onPress={() => handleSettleUp(settlement)}
                >
                  <Text style={styles.settleButtonText}>Settle up</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Expenses':
        return renderExpenses();
      case 'Balance':
        return renderBalance();
      case 'Settlement':
        return renderSettlement();
      default:
        return renderExpenses();
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton} onPress={handleGroupOptions}>
          <Ionicons name="settings" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Group Info */}
      <View style={styles.groupInfo}>
        <View style={styles.groupImageContainer}>
          <Text style={styles.groupAvatar}>{group.avatar}</Text>
          <View style={styles.membersPreview}>
            {groupMembers.slice(0, 3).map((member, index) => (
              <Image
                key={member.id}
                source={{ uri: member.avatar }}
                style={[styles.memberAvatar, { marginLeft: index * -8 }]}
              />
            ))}
          </View>
        </View>
        <Text style={styles.groupName}>{group.name}</Text>
      </View>

      {/* Group Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Group Summary</Text>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : balances[user?.uid] ? (
          (() => {
            const userBalance = balances[user?.uid];
            const settlements = calculateSettlements();
            const youOwe = settlements.filter(s => s.fromUserId === user?.uid);
            const owedToYou = settlements.filter(s => s.toUserId === user?.uid);
            
            return (
              <View>
                {userBalance.net === 0 ? (
                  <Text style={styles.summaryText}>
                    You are all settled up in {group.name}! 🎉
                  </Text>
                ) : userBalance.net > 0 ? (
                  <Text style={styles.summaryText}>
                    You get back total <Text style={styles.owedAmount}>₹{userBalance.net.toFixed(0)}</Text> in {group.name}
                  </Text>
                ) : (
                  <Text style={styles.summaryText}>
                    You owe total <Text style={styles.oweAmount}>₹{Math.abs(userBalance.net).toFixed(0)}</Text> in {group.name}
                  </Text>
                )}
                
                {owedToYou.length > 0 && owedToYou.map(settlement => (
                  <Text key={settlement.id} style={styles.summaryText}>
                    {settlement.from.replace(' (You)', '')} owes you <Text style={styles.owedAmount}>₹{settlement.amount.toFixed(0)}</Text>
                  </Text>
                ))}
                
                {youOwe.length > 0 && youOwe.map(settlement => (
                  <Text key={settlement.id} style={styles.summaryText}>
                    You owe {settlement.to.replace(' (You)', '')} <Text style={styles.oweAmount}>₹{settlement.amount.toFixed(0)}</Text>
                  </Text>
                ))}
              </View>
            );
          })()
        ) : (
          <Text style={styles.summaryText}>No expense data available</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['Expenses', 'Balance', 'Settlement'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('AddExpense', { group })}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Group Options Modal */}
      <Modal
        visible={showGroupOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGroupOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowGroupOptions(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity style={styles.optionItem} onPress={handleManageGroup}>
              <MaterialIcons name="group" size={16} color="#6B7280" style={styles.optionIconStyle} />
              <Text style={styles.optionText}>Manage Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleDeleteGroup}>
              <MaterialIcons name="delete" size={16} color="#6B7280" style={styles.optionIconStyle} />
              <Text style={styles.optionText}>Delete Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleLeaveGroup}>
              <MaterialIcons name="logout" size={16} color="#EF4444" style={styles.optionIconStyle} />
              <Text style={[styles.optionText, styles.leaveText]}>Leave Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  groupInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  groupImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  groupAvatar: {
    fontSize: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 80,
  },
  membersPreview: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  groupName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  oweAmount: {
    color: '#EF4444',
    fontWeight: '600',
  },
  owedAmount: {
    color: '#10B981',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseIconText: {
    fontSize: 18,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
  },
  expenseSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  expenseAmounts: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  expenseShare: {
    fontSize: 12,
    color: '#4F46E5',
    marginTop: 2,
  },
  balanceSection: {
    marginVertical: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  balanceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  balanceInfo: {
    flex: 1,
    marginLeft: 4,
  },
  balanceName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  expandButton: {
    padding: 8,
  },
  balanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 52,
  },
  balanceDetailAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  balanceDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  settlementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settlementAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  settlementDetails: {
    flex: 1,
  },
  settlementText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
  settleButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  settleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  settlementAmount: {
    color: '#EF4444',
    fontWeight: '700',
  },
  settlementAmountGreen: {
    color: '#10B981',
    fontWeight: '700',
  },
  settledItem: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },
  settledText: {
    color: '#6B7280',
  },
  settledTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  settledBadgeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 200,
    elevation: 8,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionIconStyle: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  leaveText: {
    color: '#EF4444',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  noDataSubtext: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  balanceAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIcon: {
    marginLeft: 8,
  },
  breakdownContainer: {
    paddingLeft: 32,
    paddingRight: 16,
    paddingBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  breakdownAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breakdownAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  breakdownText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  settlementAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settlementAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GroupDetailScreen;