import React, { useState } from 'react';
import { ScrollView, View, Text, Image, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext.jsx';
import EmptyState from './EmptyState.jsx';
import BalanceDetailsModal from './BalanceDetailsModal.jsx';
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
  const { colors: themeColors, isDarkMode } = useTheme();
  const [selectedUser, setSelectedUser] = useState(null);
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  const [receiveDetailsVisible, setReceiveDetailsVisible] = useState(false);
  const [payDetailsVisible, setPayDetailsVisible] = useState(false);

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

  // Calculate total balances and counts
  const calculateTotals = () => {
    let totalToReceive = 0;
    let totalToPay = 0;
    let receiveCount = 0;
    let payCount = 0;

    // Get the current user's balance
    const currentUserBalance = balances[userProfile?.id] || 0;

    // For each user (except current user)
    Object.entries(balances).forEach(([userId, balance]) => {
      if (userId !== userProfile?.id) {
        // If the other user's balance is negative, they owe money (current user receives)
        // If the other user's balance is positive, they are owed money (current user pays)
        if (balance < 0) {
          // Other user owes money to the group, so current user might receive
          totalToReceive += Math.abs(balance);
          receiveCount++;
        } else if (balance > 0) {
          // Other user is owed money by the group, so current user might pay
          totalToPay += balance;
          payCount++;
        }
      }
    });

    // Check if payment records indicate completed payments
    if (paymentRecords && paymentRecords.length > 0) {
      paymentRecords.forEach(record => {
        // If payment is marked as completed, adjust the totals
        if (record.status === 'completed') {
          if (record.fromUser === userProfile?.id) {
            // Current user has paid, reduce the totalToPay
            totalToPay = Math.max(0, totalToPay - record.amount);
            // Note: We don't adjust payCount here as we still want to show the person in the list
          } else if (record.toUser === userProfile?.id) {
            // Current user has received, reduce the totalToReceive
            totalToReceive = Math.max(0, totalToReceive - record.amount);
            // Note: We don't adjust receiveCount here as we still want to show the person in the list
          }
        }
      });
    }

    // Adjust based on current user's balance
    if (currentUserBalance > 0) {
      // Current user is owed money by the group
      // We keep the calculated totalToPay, but adjust totalToReceive
      totalToReceive = Math.max(totalToReceive, currentUserBalance);
    } else if (currentUserBalance < 0) {
      // Current user owes money to the group
      // We keep the calculated totalToReceive, but adjust totalToPay
      totalToPay = Math.max(totalToPay, Math.abs(currentUserBalance));
    }

    return { totalToReceive, totalToPay, receiveCount, payCount };
  };

  const { totalToReceive, totalToPay, receiveCount, payCount } = calculateTotals();

  // Handle opening the settlement modal
  const openSettlementModal = (user) => {
    setSelectedUser(user);
    setSettlementModalVisible(true);
  };

  // Close the settlement modal
  const closeSettlementModal = () => {
    setSettlementModalVisible(false);
    setSelectedUser(null);
  };

  return (
    <View style={{ flex: 1 }}>
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
        {/* Balance Summary Cards */}
        <View style={styles.balanceSummaryContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              // Open the receivable details modal
              if (totalToReceive > 0) {
                setReceiveDetailsVisible(true);
              }
            }}
          >
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={[styles.balanceSummaryCard, { backgroundColor: themeColors.surface }]}
            >
              <View style={[styles.balanceSummaryIconContainer, { backgroundColor: themeColors.success + '20' }]}>
                <Icon name="arrow-down" size={20} color={themeColors.success} />
              </View>
              <View style={styles.balanceSummaryContent}>
                <Text style={[styles.balanceSummaryLabel, { color: themeColors.textSecondary }]}>
                  To Receive
                </Text>
                <Text style={[styles.balanceSummaryAmount, { color: themeColors.success }]}>
                  ₹{totalToReceive.toFixed(2)}
                </Text>
                {totalToReceive > 0 && (
                  <>
                    <Text style={[styles.balanceSummaryCount, { color: themeColors.success }]}>
                      {receiveCount} {receiveCount === 1 ? 'person' : 'people'}
                    </Text>
                    <Text style={[styles.balanceSummarySubtext, { color: themeColors.textSecondary }]}>
                      Tap for details
                    </Text>
                  </>
                )}
              </View>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              // Open the payable details modal
              if (totalToPay > 0) {
                setPayDetailsVisible(true);
              }
            }}
          >
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={[styles.balanceSummaryCard, { backgroundColor: themeColors.surface }]}
            >
              <View style={[styles.balanceSummaryIconContainer, { backgroundColor: themeColors.danger + '20' }]}>
                <Icon name="arrow-up" size={20} color={themeColors.danger} />
              </View>
              <View style={styles.balanceSummaryContent}>
                <Text style={[styles.balanceSummaryLabel, { color: themeColors.textSecondary }]}>
                  To Pay
                </Text>
                <Text style={[styles.balanceSummaryAmount, { color: themeColors.danger }]}>
                  ₹{totalToPay.toFixed(2)}
                </Text>
                {totalToPay > 0 && (
                  <>
                    <Text style={[styles.balanceSummaryCount, { color: themeColors.danger }]}>
                      {payCount} {payCount === 1 ? 'person' : 'people'}
                    </Text>
                    <Text style={[styles.balanceSummarySubtext, { color: themeColors.textSecondary }]}>
                      Tap for details
                    </Text>
                  </>
                )}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Individual Balances
          </Text>
        </View>

        {Object.keys(balances).map((userId, index) => {
        // Skip the current user
        if (userId === userProfile?.id) {
          return null;
        }

        const user = getUserById(userId);
        const balance = balances[userId];

        // In the context of group expenses:
        // If other user's balance is negative, they owe money to the group (current user receives)
        // If other user's balance is positive, they are owed money by the group (current user pays)
        const isNegative = balance < 0; // Other user owes money (current user receives)
        const isPositive = balance > 0; // Other user is owed money (current user pays)
        const isSettled = !isPositive && !isNegative;

        // Find the corresponding payment record for this user
        const paymentRecord = paymentRecords.find(p => {
          if (isNegative) {
            // If other user's balance is negative, they owe money to the current user
            return p.fromUser === userId && p.toUser === userProfile.id && p.type === 'receive';
          } else if (isPositive) {
            // If other user's balance is positive, current user owes money to them
            return p.fromUser === userProfile.id && p.toUser === userId && p.type === 'pay';
          }
          return false;
        });

        const isCompleted = paymentRecord?.status === 'completed';
        const isPending = paymentRecord?.status === 'pending' || !paymentRecord?.status;

        // Determine background color based on balance and status
        const getBalanceBackgroundColor = () => {
          if (isNegative) { // Other user owes money (current user receives)
            return isCompleted ? themeColors.success + '15' : themeColors.warning + '15';
          }
          if (isPositive) { // Other user is owed money (current user pays)
            return isCompleted ? themeColors.success + '15' : themeColors.danger + '15';
          }
          return themeColors.surface;
        };

        // Determine text color based on balance and status
        const getBalanceTextColor = () => {
          if (isNegative) { // Other user owes money (current user receives)
            return isCompleted ? themeColors.success : themeColors.warning;
          }
          if (isPositive) { // Other user is owed money (current user pays)
            return isCompleted ? themeColors.success : themeColors.danger;
          }
          return themeColors.textSecondary;
        };

        // Determine balance icon
        const getBalanceIcon = () => {
          if (isNegative) return 'trending-up'; // Other user owes money (current user receives)
          if (isPositive) return 'trending-down'; // Other user is owed money (current user pays)
          return 'remove'; // for settled (zero balance)
        };

        // Skip the current user if they have no balance
        if (userId === userProfile?.id && isSettled) {
          return null;
        }

        return (
          <Animated.View
            key={userId}
            entering={FadeInDown.delay((index + 3) * 100).duration(400)}
            style={[styles.balanceItem, {
              backgroundColor: getBalanceBackgroundColor(),
              borderLeftWidth: 4,
              borderLeftColor: isNegative ? (isCompleted ? themeColors.success : themeColors.warning) :
                              isPositive ? (isCompleted ? themeColors.success : themeColors.danger) :
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
                    {isNegative ? 'owes you' : isPositive ? 'you owe' : 'settled up'}
                  </Text>
                </View>
              </View>

              <View style={styles.balanceContainer}>
                <View style={[styles.balanceIconContainer, {
                  backgroundColor: isNegative ? (isCompleted ? themeColors.success + '20' : themeColors.warning + '20') :
                                  isPositive ? (isCompleted ? themeColors.success + '20' : themeColors.danger + '20') :
                                  themeColors.textSecondary + '20'
                }]}>
                  <Icon
                    name={getBalanceIcon()}
                    size={16}
                    color={getBalanceTextColor()}
                  />
                </View>
                <Text style={[styles.balanceText, { color: getBalanceTextColor() }]}>
                  {isNegative ? '+' : isPositive ? '-' : ''}₹{Math.abs(balance).toFixed(2)}
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
                  {isNegative && (
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

                  {/* Show action buttons */}
                  {isPending && (
                    <TouchableOpacity
                      style={[styles.actionButton, {
                        backgroundColor: isNegative ? themeColors.success : themeColors.primary.default
                      }]}
                      onPress={() => {
                        if (isNegative && paymentRecord) {
                          // This will also update any corresponding split payments
                          handleUpdatePaymentStatus(paymentRecord.id, 'completed');
                        } else {
                          openSettlementModal({
                            id: userId,
                            name: user.name,
                            avatar: user.avatar,
                            balance: balance
                          });
                        }
                      }}
                      disabled={updatingPayment}
                    >
                      {updatingPayment ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.actionButtonText}>
                          {isNegative ? 'Mark as Received' : 'View Settlement'}
                        </Text>
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

      {/* Settlement Details Modal */}
      <Modal
        visible={settlementModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSettlementModal}
      >
      <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.settlementModalContent, { backgroundColor: themeColors.surface }]}
        >
          {/* Modal Header */}
          <View style={[styles.settlementModalHeader, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity onPress={closeSettlementModal} style={styles.closeButton}>
              <Icon name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={[styles.settlementModalTitle, { color: themeColors.text }]}>
              Settlement Details
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* User Info */}
          {selectedUser && (
            <View style={styles.settlementUserInfo}>
              {selectedUser.avatar ? (
                <Image source={{ uri: selectedUser.avatar }} style={styles.settlementUserAvatar} />
              ) : (
                <View style={[styles.settlementUserAvatarPlaceholder, { backgroundColor: themeColors.primary.default }]}>
                  <Text style={styles.settlementUserAvatarText}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.settlementUserDetails}>
                <Text style={[styles.settlementUserName, { color: themeColors.text }]}>
                  {selectedUser.name}
                </Text>

                <View style={[styles.settlementBalanceBadge, {
                  backgroundColor: selectedUser.balance > 0 ? themeColors.danger + '20' : themeColors.success + '20'
                }]}>
                  <Text style={[styles.settlementBalanceText, {
                    color: selectedUser.balance > 0 ? themeColors.danger : themeColors.success
                  }]}>
                    {selectedUser.balance > 0 ? 'You owe' : 'Owes you'} ₹{Math.abs(selectedUser.balance).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Settlement Instructions */}
          <View style={styles.settlementInstructions}>
            <Text style={[styles.settlementInstructionsTitle, { color: themeColors.text }]}>
              Optimal Settlement Plan
            </Text>

            <View style={[styles.settlementCard, { backgroundColor: themeColors.background }]}>
              <Icon
                name={selectedUser?.balance > 0 ? "arrow-up-outline" : "arrow-down-outline"}
                size={24}
                color={selectedUser?.balance > 0 ? themeColors.danger : themeColors.success}
                style={styles.settlementCardIcon}
              />

              <Text style={[styles.settlementCardText, { color: themeColors.text }]}>
                {selectedUser?.balance > 0
                  ? `You should pay ₹${Math.abs(selectedUser?.balance).toFixed(2)} to ${selectedUser?.name}`
                  : `${selectedUser?.name} should pay ₹${Math.abs(selectedUser?.balance).toFixed(2)} to you`
                }
              </Text>
            </View>

            <Text style={[styles.settlementNote, { color: themeColors.textSecondary }]}>
              This is the most efficient way to settle the balance between you and {selectedUser?.name}.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.settlementActions}>
            <TouchableOpacity
              style={[styles.settlementActionButton, { backgroundColor: themeColors.primary.default }]}
              onPress={closeSettlementModal}
            >
              <Text style={styles.settlementActionButtonText}>Close</Text>
            </TouchableOpacity>

            {selectedUser?.balance > 0 && (
              <TouchableOpacity
                style={[styles.settlementActionButton, { backgroundColor: themeColors.success }]}
                onPress={() => {
                  // Here you would implement the payment confirmation logic
                  closeSettlementModal();
                }}
              >
                <Text style={styles.settlementActionButtonText}>Mark as Paid</Text>
              </TouchableOpacity>
            )}

            {selectedUser?.balance < 0 && (
              <TouchableOpacity
                style={[styles.settlementActionButton, { backgroundColor: themeColors.success }]}
                onPress={() => {
                  // Find the payment record for this user
                  const paymentRecord = paymentRecords.find(p =>
                    p.fromUser === selectedUser.id && p.toUser === userProfile.id
                  );

                  if (paymentRecord) {
                    // This will also update any corresponding split payments
                    handleUpdatePaymentStatus(paymentRecord.id, 'completed');
                  }

                  closeSettlementModal();
                }}
              >
                <Text style={styles.settlementActionButtonText}>Mark as Received</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>

      {/* Receivable Details Modal */}
      <BalanceDetailsModal
        visible={receiveDetailsVisible}
        onClose={() => setReceiveDetailsVisible(false)}
        title="Receivable Details"
        balances={balances}
        userProfile={userProfile}
        getUserById={getUserById}
        type="receive"
      />

      {/* Payable Details Modal */}
      <BalanceDetailsModal
        visible={payDetailsVisible}
        onClose={() => setPayDetailsVisible(false)}
        title="Payment Due Details"
        balances={balances}
        userProfile={userProfile}
        getUserById={getUserById}
        type="pay"
      />
    </View>
  );
};

export default StandingTab;
