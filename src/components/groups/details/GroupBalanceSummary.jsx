import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../context/ThemeContext.jsx';
import Icon from 'react-native-vector-icons/Ionicons';
import GroupBalanceService from '../../../services/GroupBalanceService';
import UserService from '../../../services/UserService';
import { spacing, fontSizes } from '../../../theme/theme.js';

const GroupBalanceSummary = ({ groupId, userId }) => {
  const { colors: themeColors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState([]);
  const [totals, setTotals] = useState({ totalGiven: 0, totalReceived: 0, netBalance: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBalances();
  }, [groupId, userId]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!groupId || !userId) {
        setBalances([]);
        setTotals({ totalGiven: 0, totalReceived: 0, netBalance: 0 });
        return;
      }

      // Get all balance records for the user in the group
      const balanceRecords = await GroupBalanceService.getBalanceRecordsForUserInGroup(groupId, userId);

      console.log('GroupBalanceSummary - Fetched balance records:', balanceRecords);
      console.log('GroupBalanceSummary - groupId:', groupId, 'userId:', userId);

      // Calculate totals
      let totalGiven = 0;
      let totalReceived = 0;

      balanceRecords.forEach(record => {
        console.log('GroupBalanceSummary - Processing record:', record);

        // We need to check if the current user is userId or otherUserId in the record
        if (record.userId === userId) {
          // User is the primary user in the record
          totalGiven += record.totalGiven || 0;
          totalReceived += record.totalReceived || 0;
        } else if (record.otherUserId === userId) {
          // User is the other user in the record - need to invert the values
          // If user A gives to user B, then from B's perspective, B received from A
          totalGiven += record.totalReceived || 0;
          totalReceived += record.totalGiven || 0;
        }
      });

      const netBalance = totalReceived - totalGiven;

      // Update totals
      setTotals({
        totalGiven,
        totalReceived,
        netBalance
      });

      // Fetch user details for each balance record
      const enhancedBalances = await Promise.all(
        balanceRecords.map(async (record) => {
          // Determine which user ID is the other user (not the current user)
          const otherUserId = record.userId === userId ? record.otherUserId : record.userId;
          let userDetails = null;

          try {
            userDetails = await UserService.getUserById(otherUserId);
          } catch (error) {
            console.error(`Error fetching user ${otherUserId}:`, error);
          }

          // Calculate the correct given/received values based on user perspective
          let totalGiven, totalReceived, netBalance;

          if (record.userId === userId) {
            // User is the primary user in the record
            totalGiven = record.totalGiven || 0;
            totalReceived = record.totalReceived || 0;
            netBalance = (record.totalReceived || 0) - (record.totalGiven || 0);
          } else {
            // User is the other user in the record - need to invert the values
            totalGiven = record.totalReceived || 0;
            totalReceived = record.totalGiven || 0;
            netBalance = (record.totalGiven || 0) - (record.totalReceived || 0);
          }

          return {
            ...record,
            userDetails: userDetails || { id: otherUserId, name: 'Unknown User' },
            // Add perspective-adjusted values
            adjustedTotalGiven: totalGiven,
            adjustedTotalReceived: totalReceived,
            adjustedNetBalance: netBalance
          };
        })
      );

      // Sort balances by amount (highest first)
      enhancedBalances.sort((a, b) => Math.abs(b.adjustedNetBalance) - Math.abs(a.adjustedNetBalance));

      setBalances(enhancedBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
      setError('Failed to load balance summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
        <ActivityIndicator size="small" color={themeColors.primary.default} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Loading balance summary...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
        <Icon name="alert-circle-outline" size={24} color={themeColors.danger} />
        <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
      </View>
    );
  }

  if (balances.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
          No balance information available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>
        Total Balance Summary
      </Text>

      {/* Overall Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>
            Total Given
          </Text>
          <Text style={[styles.summaryValue, { color: themeColors.danger }]}>
            ₹{totals.totalGiven.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>
            Total Received
          </Text>
          <Text style={[styles.summaryValue, { color: themeColors.success }]}>
            ₹{totals.totalReceived.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>
            Net Balance
          </Text>
          <Text style={[
            styles.summaryValue,
            {
              color: totals.netBalance > 0
                ? themeColors.success
                : totals.netBalance < 0
                  ? themeColors.danger
                  : themeColors.textSecondary
            }
          ]}>
            {totals.netBalance > 0 ? '+' : totals.netBalance < 0 ? '-' : ''}
            ₹{Math.abs(totals.netBalance).toFixed(2)}
          </Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { color: themeColors.text, marginTop: spacing.lg }]}>
        Individual Balances
      </Text>

      {balances.map((balance) => {
        const isPositive = balance.adjustedNetBalance > 0;
        const isNegative = balance.adjustedNetBalance < 0;
        const isZero = balance.adjustedNetBalance === 0;

        return (
          <View key={balance.id} style={styles.balanceItem}>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: themeColors.text }]}>
                {balance.userDetails.name}
              </Text>
            </View>

            <View style={styles.amountContainer}>
              {isPositive && (
                <View style={[styles.amountBadge, { backgroundColor: themeColors.success + '20' }]}>
                  <Icon name="arrow-down" size={14} color={themeColors.success} style={styles.amountIcon} />
                  <Text style={[styles.amountText, { color: themeColors.success }]}>
                    ₹{Math.abs(balance.adjustedNetBalance).toFixed(2)}
                  </Text>
                </View>
              )}

              {isNegative && (
                <View style={[styles.amountBadge, { backgroundColor: themeColors.danger + '20' }]}>
                  <Icon name="arrow-up" size={14} color={themeColors.danger} style={styles.amountIcon} />
                  <Text style={[styles.amountText, { color: themeColors.danger }]}>
                    ₹{Math.abs(balance.adjustedNetBalance).toFixed(2)}
                  </Text>
                </View>
              )}

              {isZero && (
                <View style={[styles.amountBadge, { backgroundColor: themeColors.textSecondary + '20' }]}>
                  <Text style={[styles.amountText, { color: themeColors.textSecondary }]}>
                    ₹0.00
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.detailsContainer}>
              <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
                Given: ₹{balance.adjustedTotalGiven.toFixed(2)}
              </Text>
              <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
                Received: ₹{balance.adjustedTotalReceived.toFixed(2)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Summary styles
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: spacing.sm,
  },
  // Balance item styles
  balanceItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  userInfo: {
    marginBottom: spacing.sm,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  amountIcon: {
    marginRight: spacing.xs,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  detailText: {
    fontSize: 12,
  },
});

export default GroupBalanceSummary;
