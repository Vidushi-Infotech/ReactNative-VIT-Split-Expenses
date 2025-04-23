import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getGroupById, getExpensesByGroupId, calculateGroupBalances, getUserById, currentUser } from '../../utils/mockData.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import AvatarGroup from '../../components/common/AvatarGroup.jsx';
import ExpenseCard from '../../components/expenses/ExpenseCard.jsx';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { spacing, fontSizes, shadows, getColorWithOpacity } from '../../theme/theme.js';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 220;

const GroupDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors: themeColors, isDarkMode } = useTheme();

  // Animation values
  const tabIndicatorPosition = useSharedValue(0);

  // No refs needed

  const { groupId } = route.params || {};

  // Add error handling for group data retrieval
  let group, expenses, balances;
  try {
    group = getGroupById(groupId);
    expenses = group ? getExpensesByGroupId(groupId) : [];
    balances = group ? calculateGroupBalances(groupId) : {};
  } catch (error) {
    console.error('Error retrieving group data:', error);
    group = null;
    expenses = [];
    balances = {};
  }

  // Custom tab implementation
  const [activeTab, setActiveTab] = useState('expenses');

  const tabs = [
    { key: 'expenses', title: 'Expenses', icon: 'receipt-outline' },
    { key: 'standing', title: 'Standing', icon: 'stats-chart-outline' },
    { key: 'payments', title: 'Payments', icon: 'cash-outline' },
  ];

  // Calculate total group balance
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expenseCount = expenses.length;

  // Handle tab change with animation
  const handleTabChange = (tabKey, index) => {
    setActiveTab(tabKey);
    tabIndicatorPosition.value = withTiming(index * (SCREEN_WIDTH / 3), { duration: 300 });
  };

  // Animated styles for tab indicator
  const tabIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabIndicatorPosition.value }],
    };
  });

  // No header animation needed

  if (!group) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Group not found</Text>
      </View>
    );
  }

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', { groupId });
  };

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Group Header with Gradient Overlay */}
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: group.image }}
            style={styles.headerImage}
            resizeMode="cover"
            onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
          />

          <View
            style={[styles.headerGradient, {
              backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)'
            }]}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Group Info Card */}
          <View style={styles.headerContent}>
            <Animated.View
              style={[styles.groupInfoCard, { backgroundColor: themeColors.surface }]}
              entering={FadeInDown.duration(800)}
            >
              <View style={styles.groupInfoHeader}>
                <Text style={[styles.groupName, { color: themeColors.text }]}>
                  {group.name}
                </Text>

                <View style={styles.groupStatsContainer}>
                  <View style={styles.groupStat}>
                    <Text style={[styles.groupStatValue, { color: themeColors.primary.default }]}>
                      ${totalExpenses.toFixed(2)}
                    </Text>
                    <Text style={[styles.groupStatLabel, { color: themeColors.textSecondary }]}>
                      Total
                    </Text>
                  </View>

                  <View style={styles.groupStatDivider} />

                  <View style={styles.groupStat}>
                    <Text style={[styles.groupStatValue, { color: themeColors.primary.default }]}>
                      {expenseCount}
                    </Text>
                    <Text style={[styles.groupStatLabel, { color: themeColors.textSecondary }]}>
                      Expenses
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.groupMembersRow}>
                <AvatarGroup users={group.members} max={4} size="sm" />
                <Text style={{ color: themeColors.textSecondary }}>
                  {group.members.length} members
                </Text>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Custom Tab View with Animated Indicator */}
        <View style={{ flex: 1 }}>
          {/* Tab Bar */}
          <View style={[styles.tabBar, { backgroundColor: themeColors.surface }]}>
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => handleTabChange(tab.key, index)}
              >
                <Icon
                  name={tab.icon}
                  size={20}
                  color={activeTab === tab.key ? themeColors.primary.default : themeColors.textSecondary}
                  style={styles.tabIcon}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: activeTab === tab.key
                        ? themeColors.primary.default
                        : themeColors.textSecondary
                    }
                  ]}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Animated Tab Indicator */}
            <Animated.View
              style={[styles.tabIndicator,
                { backgroundColor: themeColors.primary.default, width: SCREEN_WIDTH / 3 },
                tabIndicatorStyle
              ]}
            />
          </View>

        {/* Tab Content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'expenses' && (
            <ScrollView
              style={styles.tabContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.expensesContainer}
            >
              {expenses.length === 0 ? (
                <Animated.View
                  style={styles.emptyStateContainer}
                  entering={FadeInDown.duration(600)}
                >
                  <Icon
                    name="receipt-outline"
                    size={70}
                    color={themeColors.textSecondary}
                    style={styles.emptyStateIcon}
                  />
                  <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
                    No Expenses Yet
                  </Text>
                  <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
                    Add your first expense to start tracking.
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyStateButton, { backgroundColor: themeColors.primary.default }]}
                    onPress={handleAddExpense}
                  >
                    <Icon name="add" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.emptyStateButtonText}>Add Expense</Text>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                expenses.map((expense, index) => (
                  <Animated.View
                    key={expense.id}
                    entering={FadeInDown.delay(index * 100).duration(400)}
                    style={styles.expenseCardContainer}
                  >
                    <ExpenseCard expense={expense} />
                  </Animated.View>
                ))
              )}
            </ScrollView>
          )}

          {activeTab === 'standing' && (
            <ScrollView
              style={styles.tabContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.balancesContainer}
            >
              {Object.keys(balances).map((userId, index) => {
                const user = getUserById(userId);
                const balance = balances[userId];
                const isPositive = balance > 0;
                const isNegative = balance < 0;
                // We'll use !isPositive && !isNegative to check if settled

                // Determine background color based on balance
                const getBalanceBackgroundColor = () => {
                  if (isPositive) return themeColors.success + '15'; // 8% opacity
                  if (isNegative) return themeColors.danger + '15'; // 8% opacity
                  return themeColors.surface;
                };

                // Determine text color based on balance
                const getBalanceTextColor = () => {
                  if (isPositive) return themeColors.success;
                  if (isNegative) return themeColors.danger;
                  return themeColors.textSecondary;
                };

                const isSettled = !isPositive && !isNegative;

                // Determine balance icon
                const getBalanceIcon = () => {
                  if (isPositive) return 'trending-up';
                  if (isNegative) return 'trending-down';
                  return 'remove'; // for settled (zero balance)
                };

                return (
                  <Animated.View
                    key={userId}
                    entering={FadeInDown.delay(index * 100).duration(400)}
                    style={[styles.balanceItem, {
                      backgroundColor: getBalanceBackgroundColor(),
                      borderLeftWidth: 4,
                      borderLeftColor: isPositive ? themeColors.success : isNegative ? themeColors.danger : isSettled ? themeColors.textSecondary : 'transparent'
                    }]}
                  >
                    <View style={styles.userInfoContainer}>
                      <Image
                        source={{ uri: user.avatar }}
                        style={styles.userAvatar}
                      />
                      <View style={styles.userTextContainer}>
                        <Text style={[styles.userName, { color: themeColors.text }]}>
                          {user.name}
                        </Text>
                        <Text style={[styles.userStatus, { color: themeColors.textSecondary }]}>
                          {isPositive ? 'is owed' : isNegative ? 'owes' : 'settled up'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.balanceContainer}>
                      <View style={[styles.balanceIconContainer, {
                        backgroundColor: isPositive ? themeColors.success + '20' :
                                        isNegative ? themeColors.danger + '20' :
                                        isSettled ? themeColors.textSecondary + '20' : themeColors.textSecondary + '20'
                      }]}>
                        <Icon
                          name={getBalanceIcon()}
                          size={16}
                          color={getBalanceTextColor()}
                        />
                      </View>
                      <Text style={[styles.balanceText, { color: getBalanceTextColor() }]}>
                        {isPositive ? '+' : isNegative ? '-' : ''}${Math.abs(balance).toFixed(2)}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </ScrollView>
          )}

          {activeTab === 'payments' && (
            <Animated.View
              style={styles.comingSoonContainer}
              entering={FadeInDown.duration(600)}
            >
              <Icon
                name="cash-outline"
                size={70}
                color={themeColors.textSecondary}
                style={styles.emptyStateIcon}
              />
              <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
                Coming Soon
              </Text>
              <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
                Payment tracking will be available in the next update.
              </Text>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Add Expense Button */}
      <TouchableOpacity
        onPress={handleAddExpense}
        style={styles.addButton}
      >
        <View
          style={[styles.addButtonInner, { backgroundColor: themeColors.primary.default }]}
        >
          <Icon name="add-outline" size={30} color={themeColors.white} />
        </View>
      </TouchableOpacity>
    </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'inherit', // Will be set dynamically
  },
  // Header styles
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: HEADER_HEIGHT,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 20,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    padding: spacing.lg,
    marginTop: -70,
    zIndex: 2,
  },
  groupInfoCard: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  groupInfoHeader: {
    marginBottom: spacing.md,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  groupStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  groupStat: {
    alignItems: 'center',
  },
  groupStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupStatLabel: {
    fontSize: 12,
  },
  groupStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  groupMembersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },

  // Tab styles
  tabBar: {
    flexDirection: 'row',
    height: 60,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontWeight: '600',
    fontSize: 12,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  // Content styles
  tabContent: {
    flex: 1,
  },
  expensesContainer: {
    padding: spacing.lg,
    paddingBottom: 100, // Extra padding for FAB
  },
  balancesContainer: {
    padding: spacing.lg,
    paddingBottom: 100, // Extra padding for FAB
  },
  expenseCardContainer: {
    marginBottom: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyStateIcon: {
    marginBottom: spacing.lg,
    opacity: 0.7,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 30,
    marginTop: spacing.md,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  // Balance item styles
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  userTextContainer: {
    marginLeft: spacing.md,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  balanceText: {
    fontWeight: 'bold',
    fontSize: 18,
  },

  // Add button styles
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    zIndex: 100,
  },
  addButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
});

export default GroupDetailsScreen;
