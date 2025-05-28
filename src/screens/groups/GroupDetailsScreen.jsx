import React, { useState, useEffect, useRef } from 'react';
import { View, RefreshControl, Alert, StatusBar } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext';
import GroupService from '../../services/GroupService';
import ExpenseService from '../../services/ExpenseService';
import UserService from '../../services/UserService';
import PaymentService from '../../services/PaymentService';
import NotificationService from '../../services/NotificationService';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

// Import custom components
import LoadingState from '../../components/groups/details/LoadingState.jsx';
import ErrorState from '../../components/groups/details/ErrorState.jsx';
import GroupHeader from '../../components/groups/details/GroupHeader.jsx';
import TabBar from '../../components/groups/details/TabBar.jsx';
import ExpensesTab from '../../components/groups/details/ExpensesTab.jsx';
import PaymentsTab from '../../components/groups/details/PaymentsTab.jsx';
import AddExpenseButton from '../../components/groups/details/AddExpenseButton.jsx';

// Import styles and constants
import styles, { HEADER_HEIGHT, TAB_BAR_HEIGHT } from '../../components/groups/details/GroupDetailsStyles';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GroupDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors: themeColors, isDarkMode } = useTheme();
  const { userProfile } = useAuth();

  // State for data
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [splitPayments, setSplitPayments] = useState([]);
  const [balances, setBalances] = useState({});
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // State for add expense button
  const [isAddButtonVisible, setIsAddButtonVisible] = useState(true);

  // Animation values
  const tabIndicatorPosition = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollRef = useRef(null);

  // Scroll handler to track scroll position
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const { groupId } = route.params || {};

  // Fetch group data when component mounts
  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  // Function to fetch group data
  const fetchGroupData = async () => {
    if (!groupId || !userProfile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch group details
      const groupData = await GroupService.getGroupById(groupId);
      setGroup(groupData);

      if (groupData) {
        // Fetch expenses for the group
        const expensesData = await ExpenseService.getExpensesByGroupId(groupId);
        setExpenses(expensesData);

        // Fetch payments for the group is now handled by generatePaymentRecords

        // Calculate balances
        const balancesData = await ExpenseService.calculateGroupBalances(groupId, expensesData, groupData.members);
        setBalances(balancesData);

        // Generate payment records based on balances
        const records = await PaymentService.generatePaymentRecords(groupId, userProfile);
        setPaymentRecords(records);

        // Fetch user details for all members
        const allUsers = await UserService.getAllUsers();
        const usersMap = {};
        allUsers.forEach(user => {
          usersMap[user.id] = user;
        });
        setUsers(usersMap);

        // Fetch split payments for the group
        const splitPaymentsData = await PaymentService.getSplitPaymentsByGroupId(groupId);

        // Attach user details to split payments
        const enhancedSplitPayments = splitPaymentsData.map(payment => {
          return {
            ...payment,
            fromUserDetails: usersMap[payment.fromUser] || { id: payment.fromUser, name: 'Unknown User' },
            toUserDetails: usersMap[payment.toUser] || { id: payment.toUser, name: 'Unknown User' }
          };
        });

        setSplitPayments(enhancedSplitPayments);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchGroupData();
  };

  // Function to handle payment status update
  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    try {
      setUpdatingPayment(true);

      // Get the payment details from the payment records
      const payment = paymentRecords.find(p => p.id === paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status in Firebase
      await PaymentService.updatePaymentStatus(paymentId, newStatus);

      // Find and update corresponding split payments
      // This ensures that when a payment is marked as received in Standing Tab,
      // it also updates the corresponding split payments in Payment Tab
      if (newStatus === 'completed' && payment.fromUser && payment.toUser) {
        // Find all split payments from this user to the current user
        const matchingSplitPayments = splitPayments.filter(sp =>
          sp.fromUser === payment.fromUser &&
          sp.toUser === payment.toUser &&
          sp.status === 'pending'
        );

        // Update all matching split payments
        for (const splitPayment of matchingSplitPayments) {
          await PaymentService.updateSplitPaymentStatus(splitPayment.id, newStatus);
        }
      }

      // If the payment is being marked as completed, send a notification to the payer
      if (newStatus === 'completed' && payment.fromUser && payment.fromUser !== userProfile.id) {
        try {
          await NotificationService.createPaymentReceivedNotification(
            payment.fromUser,
            userProfile.name || 'A user',
            payment.amount,
            group.name,
            group.id,
            paymentId
          );
          console.log(`Sent payment received notification to user ${payment.fromUser}`);
        } catch (notifError) {
          console.error('Error sending payment notification:', notifError);
          // Continue even if notification fails
        }
      }

      // Refresh data to get updated payments
      await fetchGroupData();

      Alert.alert('Success', 'Payment status updated successfully');
    } catch (error) {
      console.error('Error updating payment status:', error);
      Alert.alert('Error', 'Failed to update payment status. Please try again.');
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Function to handle split payment status update
  const handleUpdateSplitPaymentStatus = async (splitPaymentId, newStatus) => {
    try {
      setUpdatingPayment(true);

      // Get the split payment details
      const splitPayment = splitPayments.find(sp => sp.id === splitPaymentId);
      if (!splitPayment) {
        throw new Error('Split payment not found');
      }

      // Update split payment status in Firebase
      await PaymentService.updateSplitPaymentStatus(splitPaymentId, newStatus);

      // Find and update corresponding payment record
      // This ensures that when a split payment is marked as completed in Payment Tab,
      // it also updates the corresponding payment record in Standing Tab
      if (newStatus === 'completed' && splitPayment.fromUser && splitPayment.toUser) {
        // Find the payment record between these users
        const paymentId = `${splitPayment.groupId}_${splitPayment.fromUser}_${splitPayment.toUser}`;
        const matchingPayment = paymentRecords.find(p => p.id === paymentId);

        if (matchingPayment) {
          await PaymentService.updatePaymentStatus(paymentId, newStatus);
        }
      }

      // Refresh data to get updated split payments
      await fetchGroupData();

      Alert.alert('Success', 'Payment marked as paid successfully');
    } catch (error) {
      console.error('Error updating split payment status:', error);
      Alert.alert('Error', 'Failed to update payment status. Please try again.');
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Custom tab implementation
  const [activeTab, setActiveTab] = useState('expenses');

  const tabs = [
    { key: 'expenses', title: 'Expenses', icon: 'receipt-outline' },
    { key: 'payments', title: 'Payments', icon: 'cash-outline' },
  ];

  // Calculate total group balance
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expenseCount = expenses.length;

  // Handle tab change with animation
  const handleTabChange = (tabKey, index) => {
    setActiveTab(tabKey);
    tabIndicatorPosition.value = withTiming(index * (SCREEN_WIDTH / 2), { duration: 300 });
  };

  // Animated styles for sticky tabs
  const tabBarStyle = useAnimatedStyle(() => {
    // Calculate the position of the tab bar based on scroll
    // When at the top, it should be positioned after the header
    // When scrolled, it should stick to the top
    const headerOffset = HEADER_HEIGHT;

    return {
      position: 'absolute',
      top: interpolate(
        scrollY.value,
        [0, headerOffset],
        [headerOffset, 0],
        Extrapolation.CLAMP
      ),
      left: 0,
      right: 0,
      zIndex: 10,
      elevation: interpolate(
        scrollY.value,
        [0, headerOffset / 2, headerOffset],
        [0, 2, 4],
        Extrapolation.CLAMP
      ),
      shadowOpacity: interpolate(
        scrollY.value,
        [0, headerOffset / 2, headerOffset],
        [0, 0.1, 0.2],
        Extrapolation.CLAMP
      ),
      shadowRadius: interpolate(
        scrollY.value,
        [0, headerOffset],
        [0, 4],
        Extrapolation.CLAMP
      ),
      backgroundColor: themeColors.surface,
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, headerOffset / 4, headerOffset / 2, headerOffset],
            [0, -5, -10, 0],
            Extrapolation.CLAMP
          )
        }
      ]
    };
  });

  // Function to get user by ID from the users map
  const getUserById = (userId) => {
    return users[userId] || { id: userId, name: 'Unknown User', avatar: null };
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!group) {
    return <ErrorState />;
  }

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', { groupId });
  };

  // Function to handle expense card click - navigate to expense details screen
  const handleExpensePress = (expense) => {
    console.log('GroupDetailsScreen: Navigating to expense details for:', expense?.id);
    // Make sure we have a valid expense object
    if (!expense || !expense.id) {
      console.error('Invalid expense object:', expense);
      return;
    }

    // Ensure we have all required fields
    const completeExpense = {
      ...expense,
      description: expense.description || 'Unnamed Expense',
      amount: expense.amount || 0,
      date: expense.date || new Date().toISOString(),
      category: expense.category || 'Other',
      participants: expense.participants || [],
      paidByUser: expense.paidByUser || { id: expense.paidBy, name: 'Unknown User' }
    };

    // Navigate to the expense details screen
    navigation.navigate('ExpenseDetails', { expense: completeExpense });
  };

  return (
    <SafeAreaWrapper>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />

      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Main Scrollable Content */}
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollViewContent,
            {
              paddingBottom: 100 // Extra padding at bottom for FAB
            }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[themeColors.primary.default]}
              tintColor={themeColors.primary.default}
              progressBackgroundColor={themeColors.surface}
            />
          }
        >
          {/* Group Header Component with Parallax Effect */}
          <GroupHeader
            group={group}
            totalExpenses={totalExpenses}
            expenseCount={expenseCount}
            getUserById={getUserById}
            scrollY={scrollY}
          />

          {/* Space for tab bar */}
          <View style={{ height: TAB_BAR_HEIGHT + 10 }} />

          {/* Tab Content */}
          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={expenses}
              getUserById={getUserById}
              onExpensePress={handleExpensePress}
              handleAddExpense={handleAddExpense}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsTab
              splitPayments={splitPayments}
              userProfile={userProfile}
              handleUpdateSplitPaymentStatus={handleUpdateSplitPaymentStatus}
              updatingPayment={updatingPayment}
              refreshing={refreshing}
              handleRefresh={handleRefresh}
              balances={balances}
              paymentRecords={paymentRecords}
              getUserById={getUserById}
              handleUpdatePaymentStatus={handleUpdatePaymentStatus}
            />
          )}
        </Animated.ScrollView>

        {/* Tab Bar Component - Will stick to top when scrolling */}
        <Animated.View style={tabBarStyle}>
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            tabIndicatorPosition={tabIndicatorPosition}
            handleTabChange={handleTabChange}
          />
        </Animated.View>

        {/* Add Expense Button */}
        <AddExpenseButton
          onPress={handleAddExpense}
          isVisible={isAddButtonVisible}
        />
      </View>
    </SafeAreaWrapper>
  );
};

export default GroupDetailsScreen;
