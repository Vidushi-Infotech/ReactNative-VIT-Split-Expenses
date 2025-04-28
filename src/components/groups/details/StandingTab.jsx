import React from 'react';
import { ScrollView, View, Text, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext.jsx';
import EmptyState from './EmptyState.jsx';
import styles from './GroupDetailsStyles';

const StandingTab = ({
  balances,
  paymentRecords,
  userProfile,
  getUserById,
  handleUpdatePaymentStatus,
  updatingPayment,
  refreshing,
  handleRefresh
}) => {
  const { colors: themeColors } = useTheme();

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (Object.keys(balances).length === 0) {
    return (
      <EmptyState
        icon="stats-chart-outline"
        title="No Balances"
        description="There are no balances to display yet."
      />
    );
  }

  return (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.balancesContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[themeColors.primary.default]}
          tintColor={themeColors.primary.default}
        />
      }
    >


      {Object.keys(balances).map((userId, index) => {
        const user = getUserById(userId);
        const balance = balances[userId];
        const isPositive = balance > 0;
        const isNegative = balance < 0;
        const isSettled = !isPositive && !isNegative;

        // Find the corresponding payment record for this user
        const paymentRecord = paymentRecords.find(p => {
          if (isPositive) {
            // If balance is positive, current user is owed money by this user
            return p.fromUser === userId && p.toUser === userProfile.id && p.type === 'receive';
          } else if (isNegative) {
            // If balance is negative, current user owes money to this user
            return p.fromUser === userProfile.id && p.toUser === userId && p.type === 'pay';
          }
          return false;
        });

        const isCompleted = paymentRecord?.status === 'completed';
        const isPending = paymentRecord?.status === 'pending' || !paymentRecord?.status;

        // Determine background color based on balance and status
        const getBalanceBackgroundColor = () => {
          if (isPositive) {
            return isCompleted ? themeColors.success + '15' : themeColors.warning + '15';
          }
          if (isNegative) {
            return isCompleted ? themeColors.success + '15' : themeColors.danger + '15';
          }
          return themeColors.surface;
        };

        // Determine text color based on balance and status
        const getBalanceTextColor = () => {
          if (isPositive) {
            return isCompleted ? themeColors.success : themeColors.warning;
          }
          if (isNegative) {
            return isCompleted ? themeColors.success : themeColors.danger;
          }
          return themeColors.textSecondary;
        };

        // Determine balance icon
        const getBalanceIcon = () => {
          if (isPositive) return 'trending-up';
          if (isNegative) return 'trending-down';
          return 'remove'; // for settled (zero balance)
        };

        // Skip the current user if they have no balance
        if (userId === userProfile?.id && isSettled) {
          return null;
        }

        return (
          <Animated.View
            key={userId}
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={[styles.balanceItem, {
              backgroundColor: getBalanceBackgroundColor(),
              borderLeftWidth: 4,
              borderLeftColor: isPositive ? (isCompleted ? themeColors.success : themeColors.warning) :
                              isNegative ? (isCompleted ? themeColors.success : themeColors.danger) :
                              themeColors.textSecondary
            }]}
          >
            <View style={styles.balanceItemHeader}>
              <View style={styles.userInfoContainer}>
                {user.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View style={[styles.userAvatarPlaceholder, { backgroundColor: themeColors.primary.default }]}>
                    <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
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
                  backgroundColor: isPositive ? (isCompleted ? themeColors.success + '20' : themeColors.warning + '20') :
                                  isNegative ? (isCompleted ? themeColors.success + '20' : themeColors.danger + '20') :
                                  themeColors.textSecondary + '20'
                }]}>
                  <Icon
                    name={getBalanceIcon()}
                    size={16}
                    color={getBalanceTextColor()}
                  />
                </View>
                <Text style={[styles.balanceText, { color: getBalanceTextColor() }]}>
                  {isPositive ? '+' : isNegative ? '-' : ''}₹{Math.abs(balance).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Payment Status and Actions */}
            <View style={styles.paymentFooter}>
              <View style={styles.paymentMeta}>
                {paymentRecord && paymentRecord.createdAt && (
                  <Text style={[styles.paymentDate, { color: themeColors.textSecondary }]}>
                    {formatDate(paymentRecord.createdAt)}
                  </Text>
                )}

                {/* Status badge - only show for positive balances (when others owe the user) */}
                <View style={styles.statusActions}>
                  {isPositive && (
                    <View style={[styles.paymentStatusBadge, {
                      backgroundColor: isCompleted ? themeColors.success + '20' : themeColors.warning + '20'
                    }]}>
                      <Text style={[styles.paymentStatusText, {
                        color: isCompleted ? themeColors.success : themeColors.warning
                      }]}>
                        {isCompleted ? 'Received' : 'Pending'}
                      </Text>
                    </View>
                  )}

                  {/* Show action button only for pending payments where the user is owed money */}
                  {isPositive && isPending && paymentRecord && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: themeColors.success }]}
                      onPress={() => handleUpdatePaymentStatus(paymentRecord.id, 'completed')}
                      disabled={updatingPayment}
                    >
                      {updatingPayment ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.actionButtonText}>Mark as Received</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
        );
      }).filter(Boolean)}
    </ScrollView>
  );
};

export default StandingTab;
