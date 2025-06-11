import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

const GroupDetailScreen = ({ route, navigation }) => {
  const { group } = route.params;
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('Expenses');
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const [showManageGroup, setShowManageGroup] = useState(false);

  // Mock data for expenses
  const expenses = [
    {
      id: 1,
      title: 'Lunch',
      paidBy: 'You',
      amount: 320,
      yourShare: 260,
      date: '18 May',
      icon: '🍽️',
      color: '#FEF3C7',
    },
    {
      id: 2,
      title: 'Gas',
      paidBy: 'Samir J.',
      amount: 800,
      yourShare: 266.66,
      date: '18 May',
      icon: '⛽',
      color: '#FECACA',
    },
    {
      id: 3,
      title: 'Drinks',
      paidBy: 'Samir J.',
      amount: 1000,
      yourShare: 333.33,
      date: '18 May',
      icon: '🥤',
      color: '#E5E7EB',
    },
    {
      id: 4,
      title: 'Movie Tickets',
      paidBy: 'You',
      amount: 900,
      yourShare: 300,
      date: '12 May',
      icon: '🎬',
      color: '#DDD6FE',
    },
    {
      id: 5,
      title: 'Groceries',
      paidBy: 'Samir J.',
      amount: 1500,
      yourShare: 500,
      date: '20 May',
      icon: '🛒',
      color: '#FEF3C7',
    },
    {
      id: 6,
      title: 'Parking',
      paidBy: 'You',
      amount: 200,
      yourShare: 100,
      date: '15 May',
      icon: '🚗',
      color: '#FECACA',
    },
  ];

  // Mock data for balances
  const balances = [
    {
      id: 1,
      name: 'Vishal Sai (You)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      totalOwes: 320,
      details: [
        { person: 'Raj Pathan', amount: 240 },
        { person: 'Ajit Kumar', amount: 120 },
      ],
      owedBy: [
        { person: 'Samir Jakaria', amount: 40 },
      ],
    },
    {
      id: 2,
      name: 'Samir Jakaria',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      totalOwes: 200,
      details: [
        { person: 'Vishal Sai (You)', amount: 40 },
        { person: 'Ajit Kumar', amount: 160 },
      ],
    },
  ];

  // Mock data for settlements
  const settlements = [
    {
      id: 1,
      from: 'You',
      to: 'Raj Pathan',
      amount: 240,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
    },
    {
      id: 2,
      from: 'You',
      to: 'Ajit Kumar',
      amount: 120,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
    },
    {
      id: 3,
      from: 'Samir Jakaria',
      to: 'You',
      amount: 40,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
    },
  ];

  const groupMembers = [
    {
      id: 1,
      name: 'Shantanu Roy',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
    },
    {
      id: 2,
      name: 'Kavita Sharma',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
    },
    {
      id: 3,
      name: 'Rohit Mehta',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
    },
  ];

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
    <ScrollView style={styles.tabContent}>
      {expenses.map((expense) => (
        <View key={expense.id} style={styles.expenseItem}>
          <View style={[styles.expenseIcon, { backgroundColor: expense.color }]}>
            <Text style={styles.expenseIconText}>{expense.icon}</Text>
          </View>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseTitle}>{expense.title}</Text>
            <Text style={styles.expenseSubtitle}>
              Paid by {expense.paidBy}
            </Text>
            <Text style={styles.expenseDate}>{expense.date}</Text>
          </View>
          <View style={styles.expenseAmounts}>
            <Text style={styles.expenseAmount}>₹{expense.amount}</Text>
            <Text style={styles.expenseShare}>₹{expense.yourShare}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderBalance = () => (
    <ScrollView style={styles.tabContent}>
      {balances.map((balance) => (
        <View key={balance.id} style={styles.balanceSection}>
          <View style={styles.balanceHeader}>
            <Image source={{ uri: balance.avatar }} style={styles.balanceAvatar} />
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceName}>{balance.name} owes in total</Text>
              <Text style={styles.balanceAmount}>₹{balance.totalOwes}</Text>
            </View>
            <TouchableOpacity style={styles.expandButton}>
              <Ionicons name="chevron-down" size={12} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {balance.details && balance.details.map((detail, index) => (
            <View key={index} style={styles.balanceDetail}>
              <Image source={{ uri: balance.avatar }} style={styles.balanceDetailAvatar} />
              <Text style={styles.balanceDetailText}>
                {balance.name} owes ₹{detail.amount} to {detail.person}
              </Text>
            </View>
          ))}

          {balance.owedBy && balance.owedBy.map((owed, index) => (
            <View key={index} style={styles.balanceDetail}>
              <Image source={{ uri: balance.avatar }} style={styles.balanceDetailAvatar} />
              <Text style={styles.balanceDetailText}>
                {owed.person} owes ₹{owed.amount} to {balance.name}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );

  const renderSettlement = () => (
    <ScrollView style={styles.tabContent}>
      {settlements.map((settlement) => (
        <View key={settlement.id} style={styles.settlementItem}>
          <Image source={{ uri: settlement.avatar }} style={styles.settlementAvatar} />
          <View style={styles.settlementDetails}>
            <Text style={styles.settlementText}>
              {settlement.from} owes ₹{settlement.amount} to {settlement.to}
            </Text>
          </View>
          <TouchableOpacity style={styles.settleButton}>
            <Text style={styles.settleButtonText}>Settle up</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

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
        <Text style={styles.summaryText}>
          You owe total <Text style={styles.oweAmount}>₹200</Text> in {group.name}
        </Text>
        <Text style={styles.summaryText}>
          Samir Jakaria owes you <Text style={styles.owedAmount}>₹40</Text>
        </Text>
        <Text style={styles.summaryText}>
          You owe Raj Pathan <Text style={styles.oweAmount}>₹240</Text>
        </Text>
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
    paddingVertical: 12,
  },
  balanceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceName: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontSize: 14,
    color: '#2D3748',
  },
  settleButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  settleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
});

export default GroupDetailScreen;