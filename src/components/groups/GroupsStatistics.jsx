import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import GroupBalanceService from '../../services/GroupBalanceService';
import ExpenseService from '../../services/ExpenseService';
import Animated, { FadeInDown } from 'react-native-reanimated';

const GroupsStatistics = ({ groups, onRefresh }) => {
  const { colors: themeColors } = useTheme();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [totalDue, setTotalDue] = useState(0);

  useEffect(() => {
    if (groups && groups.length > 0 && userProfile) {
      calculateTotals();
    } else {
      setLoading(false);
      setTotalReceivable(0);
      setTotalDue(0);
    }
  }, [groups, userProfile]);

  // Call onRefresh when totals are calculated
  useEffect(() => {
    if (!loading && onRefresh) {
      // Only call onRefresh when loading is complete
      // This ensures we don't trigger unnecessary refreshes
    }
  }, [loading, onRefresh]);

  const calculateTotals = async () => {
    try {
      setLoading(true);
      let totalToReceive = 0;
      let totalToPay = 0;

      // Process each group to calculate the user's balance
      for (const group of groups) {
        try {
          // Get all balance records for the user in this group
          const balanceRecords = await GroupBalanceService.getBalanceRecordsForUserInGroup(
            group.id,
            userProfile.id
          );

          // Calculate the user's balance in this group
          let userReceivable = 0;
          let userDue = 0;

          balanceRecords.forEach(record => {
            // Check if the current user is userId or otherUserId in the record
            if (record.userId === userProfile.id) {
              // User is the primary user in the record
              const netBalance = (record.totalReceived || 0) - (record.totalGiven || 0);
              if (netBalance > 0) {
                userReceivable += netBalance;
              } else if (netBalance < 0) {
                userDue += Math.abs(netBalance);
              }
            } else if (record.otherUserId === userProfile.id) {
              // User is the other user in the record - need to invert the values
              const netBalance = (record.totalGiven || 0) - (record.totalReceived || 0);
              if (netBalance > 0) {
                userReceivable += netBalance;
              } else if (netBalance < 0) {
                userDue += Math.abs(netBalance);
              }
            }
          });

          // If no balance records found, try to calculate from expenses
          if (balanceRecords.length === 0) {
            const expenses = await ExpenseService.getExpensesByGroupId(group.id);
            const balances = await ExpenseService.calculateGroupBalances(group.id, expenses, group.members);

            const userBalance = balances[userProfile.id] || 0;
            if (userBalance > 0) {
              userReceivable += userBalance;
            } else if (userBalance < 0) {
              userDue += Math.abs(userBalance);
            }
          }

          // Add this group's totals to the overall totals
          totalToReceive += userReceivable;
          totalToPay += userDue;
        } catch (error) {
          console.error(`Error calculating balance for group ${group.id}:`, error);
        }
      }

      // Round to 2 decimal places
      totalToReceive = Math.round(totalToReceive * 100) / 100;
      totalToPay = Math.round(totalToPay * 100) / 100;

      setTotalReceivable(totalToReceive);
      setTotalDue(totalToPay);
    } catch (error) {
      console.error('Error calculating totals:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <Animated.View
        entering={FadeInDown.duration(800)}
        style={[styles.container, { backgroundColor: themeColors.surface }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={themeColors.primary.default} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Calculating statistics...
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (totalReceivable === 0 && totalDue === 0) {
    return null; // Don't show the component if there are no receivables or dues
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(800)}
      style={[styles.container, { backgroundColor: themeColors.surface }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Statistics</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
              Receivable Amount
            </Text>
            <Text style={[styles.statValue, { color: themeColors.success }]}>
              ₹{totalReceivable.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
              Payment Due
            </Text>
            <Text style={[styles.statValue, { color: themeColors.danger }]}>
              ₹{totalDue.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },

});

export default GroupsStatistics;
