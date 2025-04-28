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
  handleRefresh
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
        splitPayments.map((splitPayment, index) => {
          const isCompleted = splitPayment.status === 'completed';
          const isPending = splitPayment.status === 'pending';
          const isCurrentUserPayer = splitPayment.toUser === userProfile.id;
          const isCurrentUserParticipant = splitPayment.fromUser === userProfile.id;

          // Get user details
          const fromUser = splitPayment.fromUserDetails;
          const toUser = splitPayment.toUserDetails;

          // Only show split payments where the current user is involved
          if (!isCurrentUserPayer && !isCurrentUserParticipant) {
            return null;
          }

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
                        onPress={() => handleUpdateSplitPaymentStatus(splitPayment.id, 'completed')}
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
                        onPress={() => handleUpdateSplitPaymentStatus(splitPayment.id, 'completed')}
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
        }).filter(Boolean)
      )}
    </ScrollView>
  );
};

export default PaymentsTab;
