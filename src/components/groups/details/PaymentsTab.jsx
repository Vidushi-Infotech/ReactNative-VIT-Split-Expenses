import React from 'react';
import { ScrollView, View, Text, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext.jsx';
import EmptyState from './EmptyState.jsx';
import PaymentSummary from './PaymentSummary.jsx';
import styles from './GroupDetailsStyles';

const PaymentsTab = ({
  splitPayments,
  userProfile,
  handleUpdateSplitPaymentStatus,
  updatingPayment,
  refreshing,
  handleRefresh,
  balances,
  paymentRecords,
  getUserById,
  handleUpdatePaymentStatus
}) => {
  const { colors: themeColors } = useTheme();

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.paymentsContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[themeColors.primary.default]}
          tintColor={themeColors.primary.default}
        />
      }
    >
      {/* Payment Summary */}
      <PaymentSummary
        splitPayments={splitPayments}
        userProfile={userProfile}
        handleUpdateSplitPaymentStatus={handleUpdateSplitPaymentStatus}
        updatingPayment={updatingPayment}
        handleRefresh={handleRefresh}
        balances={balances}
        paymentRecords={paymentRecords}
        getUserById={getUserById}
        handleUpdatePaymentStatus={handleUpdatePaymentStatus}
      />

      {/* Section Title for Expense Splits */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Expense Splits
        </Text>
      </View>

      {splitPayments.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No Split Payments"
          description="There are no individual expense splits in this group."
        />
      ) : (
        // First, filter and deduplicate the split payments
        (() => {
          // Create a map to track unique expense-user combinations
          const uniquePaymentMap = new Map();

          // Use the same approach as in StandingTab to generate payment items from balances
          const filteredPayments = [];

          // Get the current user's balance
          const currentUserBalance = balances[userProfile?.id] || 0;

          // For each user (except current user)
          Object.entries(balances).forEach(([userId, balance]) => {
            if (userId !== userProfile?.id) {
              const user = getUserById(userId);

              // In the context of group expenses:
              // If other user's balance is negative, they owe money to the group (current user receives)
              // If other user's balance is positive, they are owed money by the group (current user pays)
              const isNegative = balance < 0; // Other user owes money (current user receives)
              const isPositive = balance > 0; // Other user is owed money (current user pays)

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

              if (paymentRecord) {
                // Create a payment object that matches the structure expected by the component
                const payment = {
                  id: paymentRecord.id,
                  groupId: paymentRecord.groupId,
                  fromUser: isNegative ? userId : userProfile.id,
                  toUser: isNegative ? userProfile.id : userId,
                  amount: Math.abs(balance),
                  status: paymentRecord.status || 'pending',
                  createdAt: paymentRecord.createdAt || new Date().toISOString(),
                  fromUserDetails: isNegative ? user : userProfile,
                  toUserDetails: isNegative ? userProfile : user,
                  // Add any other fields needed
                };

                // Add to filtered payments
                filteredPayments.push(payment);

                // Add to map to avoid duplicates
                const paymentKey = `${payment.fromUser}_${payment.toUser}`;
                uniquePaymentMap.set(paymentKey, payment);
              }
            }
          });

          // Also include any split payments that aren't already covered by the balance-based payments
          splitPayments.forEach(payment => {
            const isCurrentUserPayer = payment.toUser === userProfile.id;
            const isCurrentUserParticipant = payment.fromUser === userProfile.id;

            // Skip if current user is not involved
            if (!isCurrentUserPayer && !isCurrentUserParticipant) {
              return;
            }

            // Create a unique key for this payment
            const paymentKey = `${payment.fromUser}_${payment.toUser}`;

            // Only add if we don't already have a payment for this user pair
            if (!uniquePaymentMap.has(paymentKey)) {
              filteredPayments.push(payment);
              uniquePaymentMap.set(paymentKey, payment);
            }
          });

          // Sort by date (newest first)
          filteredPayments.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
          });

          return filteredPayments.map((splitPayment, index) => {
            const isCompleted = splitPayment.status === 'completed';
            const isPending = splitPayment.status === 'pending';
            const isCurrentUserPayer = splitPayment.toUser === userProfile.id;
            const isCurrentUserParticipant = splitPayment.fromUser === userProfile.id;

            // Get user details
            const fromUser = splitPayment.fromUserDetails;
            const toUser = splitPayment.toUserDetails;

          return (
            <Animated.View
              key={splitPayment.id}
              entering={FadeInDown.delay(index * 100).duration(400)}
              style={[styles.paymentItem, {
                backgroundColor: isCompleted ? themeColors.success + '15' : themeColors.warning + '15',
                borderLeftWidth: 4,
                borderLeftColor: isCompleted ? themeColors.success : themeColors.warning
              }]}
            >
              <View style={styles.paymentHeader}>
                <View style={styles.userInfoContainer}>
                  <View style={styles.paymentUsers}>
                    {isCurrentUserParticipant ? (
                      // Current user is the participant (owes money)
                      <>
                        <View style={styles.paymentUserContainer}>
                          {userProfile.avatar ? (
                            <Image
                              source={{ uri: userProfile.avatar }}
                              style={styles.paymentUserAvatar}
                            />
                          ) : (
                            <View style={[styles.paymentUserAvatarPlaceholder, { backgroundColor: themeColors.primary.default }]}>
                              <Text style={styles.paymentUserAvatarText}>{userProfile.name.charAt(0).toUpperCase()}</Text>
                            </View>
                          )}
                          <Text style={[styles.paymentUserName, { color: themeColors.text }]}>
                            You
                          </Text>
                        </View>

                        <View style={styles.paymentArrow}>
                          <Icon
                            name="arrow-forward"
                            size={16}
                            color={isCompleted ? themeColors.success : themeColors.warning}
                          />
                        </View>

                        <View style={styles.paymentUserContainer}>
                          {toUser && toUser.avatar ? (
                            <Image
                              source={{ uri: toUser.avatar }}
                              style={styles.paymentUserAvatar}
                            />
                          ) : (
                            <View style={[styles.paymentUserAvatarPlaceholder, { backgroundColor: themeColors.primary.default }]}>
                              <Text style={styles.paymentUserAvatarText}>
                                {toUser && toUser.name ? toUser.name.charAt(0).toUpperCase() : '?'}
                              </Text>
                            </View>
                          )}
                          <Text style={[styles.paymentUserName, { color: themeColors.text }]}>
                            {toUser && toUser.name ? toUser.name.split(' ')[0] : 'Unknown'}
                          </Text>
                        </View>
                      </>
                    ) : (
                      // Current user is the payer (is owed money)
                      <>
                        <View style={styles.paymentUserContainer}>
                          {fromUser && fromUser.avatar ? (
                            <Image
                              source={{ uri: fromUser.avatar }}
                              style={styles.paymentUserAvatar}
                            />
                          ) : (
                            <View style={[styles.paymentUserAvatarPlaceholder, { backgroundColor: themeColors.primary.default }]}>
                              <Text style={styles.paymentUserAvatarText}>
                                {fromUser && fromUser.name ? fromUser.name.charAt(0).toUpperCase() : '?'}
                              </Text>
                            </View>
                          )}
                          <Text style={[styles.paymentUserName, { color: themeColors.text }]}>
                            {fromUser && fromUser.name ? fromUser.name.split(' ')[0] : 'Unknown'}
                          </Text>
                        </View>

                        <View style={styles.paymentArrow}>
                          <Icon
                            name="arrow-forward"
                            size={16}
                            color={isCompleted ? themeColors.success : themeColors.warning}
                          />
                        </View>

                        <View style={styles.paymentUserContainer}>
                          {userProfile.avatar ? (
                            <Image
                              source={{ uri: userProfile.avatar }}
                              style={styles.paymentUserAvatar}
                            />
                          ) : (
                            <View style={[styles.paymentUserAvatarPlaceholder, { backgroundColor: themeColors.primary.default }]}>
                              <Text style={styles.paymentUserAvatarText}>{userProfile.name.charAt(0).toUpperCase()}</Text>
                            </View>
                          )}
                          <Text style={[styles.paymentUserName, { color: themeColors.text }]}>
                            You
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>

                <Text style={[styles.paymentAmount, {
                  color: isCompleted ? themeColors.success : themeColors.warning
                }]}>
                  ₹{splitPayment.amount ? splitPayment.amount.toFixed(2) : '0.00'}
                </Text>
              </View>

              <View style={styles.paymentFooter}>
                <View style={styles.paymentMeta}>
                  <Text style={[styles.paymentDate, { color: themeColors.textSecondary }]}>
                    {splitPayment.createdAt ? formatDate(splitPayment.createdAt) : 'Unknown date'}
                  </Text>

                  <View style={styles.statusActions}>
                    <View style={[styles.paymentStatusBadge, {
                      backgroundColor: isCompleted ? themeColors.success + '20' : themeColors.warning + '20'
                    }]}>
                      <Text style={[styles.paymentStatusText, {
                        color: isCompleted ? themeColors.success : themeColors.warning
                      }]}>
                        {isCompleted ? (isCurrentUserParticipant ? 'Paid' : 'Received') : (isCurrentUserParticipant ? 'To Pay' : 'Pending')}
                      </Text>
                    </View>

                    {/* Show Mark as Paid button for current user's pending payments */}
                    {isPending && isCurrentUserParticipant && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: themeColors.success }]}
                        onPress={() => {
                          // Check if this is a payment record or split payment
                          if (splitPayment.id.includes('_')) {
                            // This is a payment record (from balances)
                            handleUpdatePaymentStatus(splitPayment.id, 'completed');
                          } else {
                            // This is a split payment
                            handleUpdateSplitPaymentStatus(splitPayment.id, 'completed');
                          }
                        }}
                        disabled={updatingPayment}
                      >
                        {updatingPayment ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text style={styles.actionButtonText}>Mark as Paid</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Show Mark as Received button for payments owed to current user */}
                    {isPending && isCurrentUserPayer && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: themeColors.success }]}
                        onPress={() => {
                          // Check if this is a payment record or split payment
                          if (splitPayment.id.includes('_')) {
                            // This is a payment record (from balances)
                            handleUpdatePaymentStatus(splitPayment.id, 'completed');
                          } else {
                            // This is a split payment
                            handleUpdateSplitPaymentStatus(splitPayment.id, 'completed');
                          }
                        }}
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
          });
        })()
      )}
    </ScrollView>
  );
};

export default PaymentsTab;
