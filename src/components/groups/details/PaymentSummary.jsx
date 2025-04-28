import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Image, ScrollView, FlatList, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext.jsx';
import { spacing, fontSizes } from '../../../theme/theme.js';
import PaymentService from '../../../services/PaymentService';
import NotificationService from '../../../services/NotificationService';
import { getDoc, doc } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseInitialized } from '../../../config/firebase';

// Helper function to get icon name based on expense category
const getCategoryIcon = (category) => {
  const categoryMap = {
    'Food': 'restaurant-outline',
    'Groceries': 'cart-outline',
    'Transport': 'car-outline',
    'Entertainment': 'film-outline',
    'Shopping': 'bag-outline',
    'Utilities': 'flash-outline',
    'Rent': 'home-outline',
    'Travel': 'airplane-outline',
    'Health': 'medical-outline',
    'Education': 'school-outline',
    'Personal': 'person-outline',
    'Other': 'ellipsis-horizontal-outline'
  };

  return categoryMap[category] || 'pricetag-outline';
};

const PaymentSummary = ({
  splitPayments,
  userProfile,
  handleUpdateSplitPaymentStatus,
  updatingPayment,
  handleRefresh,
  balances,
  paymentRecords,
  getUserById,
  handleUpdatePaymentStatus
}) => {
  const { colors: themeColors, isDarkMode } = useTheme();

  // State for receive modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState('');

  // State for details modals
  const [receiveDetailsModalVisible, setReceiveDetailsModalVisible] = useState(false);
  const [payDetailsModalVisible, setPayDetailsModalVisible] = useState(false);
  const [selectedUserTab, setSelectedUserTab] = useState(0);

  // Calculate totals
  const [totalToReceive, setTotalToReceive] = useState(0);
  const [totalToPay, setTotalToPay] = useState(0);
  const [pendingReceivables, setPendingReceivables] = useState([]);
  const [pendingPayables, setPendingPayables] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      await calculateTotals();
    };
    fetchData();
  }, [splitPayments, balances, paymentRecords]);

  // Reset selected user tab when modal opens
  useEffect(() => {
    if (receiveDetailsModalVisible) {
      setSelectedUserTab(0);
    }
  }, [receiveDetailsModalVisible]);

  // Function to refresh data after payment status changes
  const refreshData = async () => {
    await calculateTotals();
    // The parent component will handle the actual data refresh
    if (handleRefresh) {
      handleRefresh();
    }
  };

  const calculateTotals = async () => {
    try {
      // Use the same calculation logic as in StandingTab
      let toReceive = 0;
      let toPay = 0;
      const receivables = [];
      const payables = [];

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

          if (isNegative) {
            // Other user owes money to the current user (To Receive)
            const amount = Math.abs(balance);
            toReceive += amount;

            // Get all split payments for this user
            const userSplitPayments = splitPayments.filter(payment =>
              payment.fromUser === userId &&
              payment.toUser === userProfile.id &&
              payment.status !== 'completed'
            );

            // Group payments by expense ID to avoid duplicates
            const paymentsByExpense = {};

            // Process all split payments
            userSplitPayments.forEach(payment => {
              const expenseId = payment.expenseId;

              // If we already have a payment for this expense, skip it
              if (paymentsByExpense[expenseId]) {
                return;
              }

              // Find the corresponding expense in the payment record
              const paymentRecord = paymentRecords.find(p =>
                p.fromUser === userId &&
                p.toUser === userProfile.id &&
                p.expenseId === expenseId
              );

              // Store the payment with enhanced details
              paymentsByExpense[expenseId] = {
                ...payment,
                splitAmount: payment.amount,
                expenseDetails: {
                  ...(payment.expenseDetails || {}),
                  ...(paymentRecord?.expenseDetails || {})
                }
              };
            });

            // Convert the grouped payments back to an array
            const enhancedPayments = Object.values(paymentsByExpense);

            // Check if there's a payment record and if it's pending
            const isPending = !paymentRecord || paymentRecord.status === 'pending';

            // Only add to receivables if the payment is pending
            if (isPending) {
              receivables.push({
                userId: userId,
                userName: user.name || 'Unknown User',
                userAvatar: user.avatar,
                amount: amount,
                payments: enhancedPayments.length > 0 ? enhancedPayments : (paymentRecord ? [paymentRecord] : []),
                balance: balance,
                status: paymentRecord?.status || 'pending'
              });
            }
          } else if (isPositive) {
            // Current user owes money to the other user (To Pay)
            const amount = balance;
            toPay += amount;

            payables.push({
              userId: userId,
              toUser: userId,
              toUserName: user.name || 'Unknown User',
              toUserAvatar: user.avatar,
              amount: amount,
              payments: paymentRecord ? [paymentRecord] : [],
              status: paymentRecord?.status || 'pending',
              date: paymentRecord?.createdAt || new Date().toISOString(),
              balance: balance
            });
          }
        }
      });

      // Adjust based on current user's balance
      if (currentUserBalance > 0) {
        // Current user is owed money by the group
        toReceive = currentUserBalance;
        toPay = 0;
      } else if (currentUserBalance < 0) {
        // Current user owes money to the group
        toReceive = 0;
        toPay = Math.abs(currentUserBalance);
      }

      // Sort receivables by amount (highest first)
      receivables.sort((a, b) => b.amount - a.amount);

      // Sort payables by date (newest first)
      payables.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      console.log('Payment Summary - Calculated totals:', { toReceive, toPay });
      console.log('Payment Summary - Receivables:', receivables.length);
      console.log('Payment Summary - Payables:', payables.length);

      setTotalToReceive(toReceive);
      setTotalToPay(toPay);
      setPendingReceivables(receivables);
      setPendingPayables(payables);
    } catch (error) {
      console.error('Error calculating totals:', error);
    }
  };

  const handleReceiveAll = async (userId) => {
    try {
      // Find the receivable for this user
      const receivable = pendingReceivables.find(r => r.userId === userId);
      if (!receivable) {
        setError('No receivable found for this user');
        return;
      }

      // Find the payment record for this user
      const paymentRecord = paymentRecords.find(p =>
        p.fromUser === userId && p.toUser === userProfile.id && p.type === 'receive'
      );

      if (!paymentRecord) {
        setError('No payment record found for this user');
        return;
      }

      // Get the amount to be received
      const amountToReceive = receivable.amount;

      // Use the markCustomAmountAsReceived service to handle full payments
      const success = await PaymentService.markCustomAmountAsReceived(
        paymentRecord.groupId,
        userId,                // fromUser (who owes money)
        userProfile.id,        // toUser (current user who is owed money)
        amountToReceive
      );

      if (!success) {
        setError('Failed to update payment status');
        return;
      }

      // Get user details for notification
      const userName = receivable.userName || 'Unknown User';

      // Close modal
      setModalVisible(false);
      setSelectedPayment(null);
      setError('');

      // Update the local state to reflect the payment
      // This will immediately update the UI without waiting for a refresh
      setPendingReceivables(prevReceivables =>
        prevReceivables.filter(r => r.userId !== userId)
      );

      // Update the total to receive amount
      setTotalToReceive(prevTotal => Math.max(0, prevTotal - amountToReceive));

      // Refresh the payments list
      await refreshData();

      // Show success message
      Alert.alert(
        'Payment Received',
        `You have marked ₹${amountToReceive.toFixed(2)} as received from ${userName}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error marking payments as received:', error);
      setError('Failed to update payment status');
    }
  };

  const handleReceiveCustom = async () => {
    try {
      if (!selectedPayment) return;

      const amount = parseFloat(customAmount);

      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (amount > selectedPayment.amount) {
        setError(`Amount cannot exceed ₹${selectedPayment.amount.toFixed(2)}`);
        return;
      }

      // Find the payment record for this user
      const paymentRecord = paymentRecords.find(p =>
        p.fromUser === selectedPayment.userId && p.toUser === userProfile.id && p.type === 'receive'
      );

      if (!paymentRecord) {
        setError('No payment record found for this user');
        return;
      }

      // Use the markCustomAmountAsReceived service to handle partial payments
      const success = await PaymentService.markCustomAmountAsReceived(
        paymentRecord.groupId,
        selectedPayment.userId,  // fromUser (who owes money)
        userProfile.id,          // toUser (current user who is owed money)
        amount
      );

      if (!success) {
        setError('Failed to update payment status');
        return;
      }

      // Get user details for notification
      let fromUserName = selectedPayment.userName || 'Unknown User';

      // Close modal
      setModalVisible(false);
      setSelectedPayment(null);
      setCustomAmount('');
      setError('');

      // Update the local state to reflect the payment
      // This will immediately update the UI without waiting for a refresh
      if (amount === selectedPayment.amount) {
        // If full amount is received, remove the receivable
        setPendingReceivables(prevReceivables =>
          prevReceivables.filter(r => r.userId !== selectedPayment.userId)
        );
      } else {
        // If partial amount is received, update the amount
        setPendingReceivables(prevReceivables =>
          prevReceivables.map(r => {
            if (r.userId === selectedPayment.userId) {
              return {
                ...r,
                amount: r.amount - amount
              };
            }
            return r;
          })
        );
      }

      // Update the total to receive amount
      setTotalToReceive(prevTotal => Math.max(0, prevTotal - amount));

      // Refresh the payments list
      await refreshData();

      // Show success message
      Alert.alert(
        'Payment Received',
        `You have marked ₹${amount.toFixed(2)} as received from ${fromUserName}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error marking custom amount as received:', error);
      setError('Failed to update payment status');
    }
  };

  const openReceiveModal = (receivable) => {
    setSelectedPayment(receivable);
    setCustomAmount(receivable.amount.toString());
    setError('');
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        {/* To Receive Card */}
        <TouchableOpacity
          style={[styles.summaryCard, {
            backgroundColor: themeColors.surface,
            borderWidth: 1,
            borderColor: themeColors.success + '30',
            shadowColor: themeColors.success,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2
          }]}
          onPress={() => totalToReceive > 0 && setReceiveDetailsModalVisible(true)}
          activeOpacity={0.7}
          disabled={totalToReceive <= 0}
        >
          <View style={styles.summaryCardContent}>
            <View style={[styles.summaryIconContainer, { backgroundColor: themeColors.success + '15' }]}>
              <Icon name="arrow-down-circle" size={24} color={themeColors.success} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>
                To Receive
              </Text>
              <Text style={[styles.summaryAmount, { color: themeColors.success }]}>
                ₹{totalToReceive.toFixed(2)}
              </Text>
              {pendingReceivables.length > 0 && (
                <Text style={[styles.summarySubtext, { color: themeColors.textSecondary }]}>
                  from {pendingReceivables.length} {pendingReceivables.length === 1 ? 'person' : 'people'}
                </Text>
              )}
            </View>
          </View>

          {totalToReceive > 0 && (
            <View style={styles.summaryIndicator}>
              <Icon
                name="chevron-forward"
                size={16}
                color={themeColors.success}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* To Pay Card */}
        <TouchableOpacity
          style={[styles.summaryCard, {
            backgroundColor: themeColors.surface,
            borderWidth: 1,
            borderColor: themeColors.danger + '30',
            shadowColor: themeColors.danger,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2
          }]}
          onPress={() => totalToPay > 0 && setPayDetailsModalVisible(true)}
          activeOpacity={0.7}
          disabled={totalToPay <= 0}
        >
          <View style={styles.summaryCardContent}>
            <View style={[styles.summaryIconContainer, { backgroundColor: themeColors.danger + '15' }]}>
              <Icon name="arrow-up-circle" size={24} color={themeColors.danger} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>
                To Pay
              </Text>
              <Text style={[styles.summaryAmount, { color: themeColors.danger }]}>
                ₹{totalToPay.toFixed(2)}
              </Text>
              {pendingPayables.length > 0 && (
                <Text style={[styles.summarySubtext, { color: themeColors.textSecondary }]}>
                  to {pendingPayables.length} {pendingPayables.length === 1 ? 'person' : 'people'}
                </Text>
              )}
            </View>
          </View>

          {totalToPay > 0 && (
            <View style={styles.summaryIndicator}>
              <Icon
                name="chevron-forward"
                size={16}
                color={themeColors.danger}
              />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Pending Receivables */}
      {pendingReceivables.length > 0 && (
        <View style={styles.receivablesContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Icon name="cash-outline" size={20} color={themeColors.primary.default} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Pending Receivables
            </Text>
          </View>

          {pendingReceivables.map((receivable, index) => (
            <View
              key={receivable.userId}
              style={[
                styles.receivableItem,
                {
                  backgroundColor: themeColors.surface,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                  shadowColor: themeColors.text,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  marginBottom: index === pendingReceivables.length - 1 ? 0 : spacing.md
                }
              ]}
            >
              <View style={styles.receivableContent}>
                {/* User Info Section */}
                <View style={styles.receivableUserInfo}>
                  <View style={styles.receivableUserAvatar}>
                    {receivable.userAvatar ? (
                      <Image
                        source={{ uri: receivable.userAvatar }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={[styles.avatarPlaceholder, {
                        backgroundColor: themeColors.primary.default,
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.2)'
                      }]}>
                        <Text style={styles.avatarText}>
                          {receivable.userName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.receivableUserDetails}>
                    <Text style={[styles.receivableUserName, { color: themeColors.text }]}>
                      {receivable.userName}
                    </Text>
                    <View style={styles.amountContainer}>
                      <View style={[styles.amountBadgeSmall, { backgroundColor: themeColors.success + '15' }]}>
                        <Icon name="arrow-down" size={12} color={themeColors.success} style={styles.amountIcon} />
                        <Text style={[styles.receivableAmount, { color: themeColors.success }]}>
                          ₹{receivable.amount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Button Section */}
                {/* Only show Receive button if status is pending */}
                {(receivable.status === 'pending' || !receivable.status) && (
                  <TouchableOpacity
                    style={[styles.receiveButton, {
                      backgroundColor: themeColors.success,
                      shadowColor: themeColors.success,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                      elevation: 2
                    }]}
                    onPress={() => openReceiveModal(receivable)}
                    disabled={updatingPayment}
                  >
                  {updatingPayment ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Icon name="checkmark-circle" size={14} color="white" style={styles.buttonIcon} />
                      <Text style={styles.buttonText}>Receive</Text>
                    </>
                  )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Custom Amount Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContainer,
            {
              backgroundColor: themeColors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 10
            }
          ]}>
            <View style={styles.modalHandleBar}>
              <View style={[styles.modalHandle, { backgroundColor: themeColors.border }]} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Mark as Received
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: themeColors.background + '50' }]}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="close" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedPayment && (
              <View style={styles.modalContent}>
                <View style={styles.userInfoModalContainer}>
                  <View style={styles.receivableUserAvatar}>
                    {selectedPayment.userAvatar ? (
                      <Image
                        source={{ uri: selectedPayment.userAvatar }}
                        style={styles.avatarImageLarge}
                      />
                    ) : (
                      <View style={[styles.avatarPlaceholderLarge, { backgroundColor: themeColors.primary.default }]}>
                        <Text style={styles.avatarTextLarge}>
                          {selectedPayment.userName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.userInfoTextContainer}>
                    <Text style={[styles.modalUserName, { color: themeColors.text }]}>
                      {selectedPayment.userName}
                    </Text>

                    <View style={[styles.amountBadge, { backgroundColor: themeColors.success + '15' }]}>
                      <Icon name="cash-outline" size={14} color={themeColors.success} style={styles.amountIcon} />
                      <Text style={[styles.amountBadgeText, { color: themeColors.success }]}>
                        ₹{selectedPayment.amount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {error ? (
                  <View style={[styles.errorContainer, { backgroundColor: themeColors.danger + '10', borderColor: themeColors.danger + '30' }]}>
                    <Icon name="alert-circle-outline" size={18} color={themeColors.danger} style={styles.errorIcon} />
                    <Text style={[styles.errorText, { color: themeColors.danger }]}>
                      {error}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[styles.optionButton, {
                      backgroundColor: themeColors.success,
                      shadowColor: themeColors.success,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 3
                    }]}
                    onPress={() => handleReceiveAll(selectedPayment.userId)}
                    disabled={updatingPayment}
                  >
                    {updatingPayment ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Icon name="checkmark-circle" size={18} color="white" style={styles.optionButtonIcon} />
                        <Text style={styles.optionButtonText}>Receive All</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.dividerContainer}>
                    <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
                    <Text style={[styles.orText, { color: themeColors.textSecondary, backgroundColor: themeColors.surface }]}>OR</Text>
                    <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
                  </View>

                  <View style={styles.customAmountContainer}>
                    <Text style={[styles.customAmountLabel, { color: themeColors.text }]}>
                      Custom Amount:
                    </Text>
                    <View style={[styles.inputContainer, {
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background + '50'
                    }]}>
                      <Text style={{ color: themeColors.text, fontWeight: '600' }}>₹</Text>
                      <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        value={customAmount}
                        onChangeText={setCustomAmount}
                        keyboardType="numeric"
                        placeholder="Enter amount"
                        placeholderTextColor={themeColors.textSecondary}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.customButton, {
                        backgroundColor: themeColors.primary.default,
                        shadowColor: themeColors.primary.default,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 3
                      }]}
                      onPress={handleReceiveCustom}
                      disabled={updatingPayment}
                    >
                      {updatingPayment ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Icon name="cash-outline" size={18} color="white" style={styles.optionButtonIcon} />
                          <Text style={styles.customButtonText}>Receive Custom Amount</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* To Receive Details Modal - Simplified Design */}
      <Modal
        visible={receiveDetailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReceiveDetailsModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.surface }}>
          {/* Header */}
          <View style={[styles.newModalHeader, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity
              style={styles.newModalBackButton}
              onPress={() => setReceiveDetailsModalVisible(false)}
            >
              <Icon name="arrow-back" size={24} color={themeColors.primary.default} />
            </TouchableOpacity>
            <Text style={[styles.newModalTitle, { color: themeColors.text }]}>
              Pending Receivables
            </Text>
            <View style={[styles.newModalTotalBadge, { backgroundColor: themeColors.success + '15' }]}>
              <Text style={[styles.newModalTotalText, { color: themeColors.success }]}>
                ₹{totalToReceive.toFixed(2)}
              </Text>
            </View>
          </View>

          {pendingReceivables.length > 0 ? (
            <FlatList
              data={pendingReceivables}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={styles.newModalList}
              renderItem={({ item: receivable }) => (
                <View style={[styles.newModalUserCard, {
                  backgroundColor: themeColors.background + '50',
                  borderColor: themeColors.border
                }]}>
                  {/* User Info */}
                  <View style={styles.newModalUserInfo}>
                    <View style={styles.newModalUserAvatar}>
                      {receivable.userAvatar ? (
                        <Image
                          source={{ uri: receivable.userAvatar }}
                          style={styles.newModalAvatarImage}
                        />
                      ) : (
                        <View style={[styles.newModalAvatarPlaceholder, { backgroundColor: themeColors.primary.default }]}>
                          <Text style={styles.newModalAvatarText}>
                            {receivable.userName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.newModalUserDetails}>
                      <Text style={[styles.newModalUserName, { color: themeColors.text }]}>
                        {receivable.userName}
                      </Text>
                      <View style={styles.newModalAmountRow}>
                        <Icon name="arrow-down-circle" size={16} color={themeColors.success} style={{ marginRight: 4 }} />
                        <Text style={[styles.newModalAmount, { color: themeColors.success }]}>
                          ₹{receivable.amount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    {/* Only show Receive button if status is pending */}
                    {(receivable.status === 'pending' || !receivable.status) && (
                      <TouchableOpacity
                        style={[styles.newModalReceiveButton, {
                          backgroundColor: themeColors.success,
                        }]}
                        onPress={() => {
                          setReceiveDetailsModalVisible(false);
                          setTimeout(() => openReceiveModal(receivable), 300);
                        }}
                        disabled={updatingPayment}
                      >
                      {updatingPayment ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.newModalButtonText}>Receive</Text>
                      )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Expense List */}
                  <View style={styles.newModalExpenseList}>
                    {/* Calculate unique expense count */}
                    {(() => {
                      // Get unique expense IDs
                      const uniqueExpenseIds = new Set();
                      receivable.payments.forEach(payment => {
                        if (payment.expenseId) {
                          uniqueExpenseIds.add(payment.expenseId);
                        }
                      });

                      return (
                        <Text style={[styles.newModalSectionTitle, { color: themeColors.text }]}>
                          Expense Details ({uniqueExpenseIds.size}) - Total: ₹{receivable.amount.toFixed(2)}
                        </Text>
                      );
                    })()}

                    {/* Create a map to deduplicate expenses by ID */}
                    {(() => {
                      // Create a map of expenses by ID to avoid duplicates
                      const expenseMap = {};

                      // Process all payments to get unique expenses
                      receivable.payments.forEach(payment => {
                        const expenseId = payment.expenseId;

                        // Skip if we already have this expense
                        if (expenseMap[expenseId]) {
                          return;
                        }

                        // Get expense details
                        let expenseDetails = payment.expenseDetails;

                        // If we don't have expense details, try to find them in the payment record
                        if (!expenseDetails && expenseId) {
                          // Find the corresponding expense in the payment record
                          const paymentRecord = paymentRecords.find(p =>
                            p.fromUser === receivable.userId &&
                            p.toUser === userProfile.id &&
                            p.expenseId === expenseId
                          );

                          if (paymentRecord && paymentRecord.expenseDetails) {
                            expenseDetails = paymentRecord.expenseDetails;
                          }
                        }

                        // Store the payment with its details
                        expenseMap[expenseId] = {
                          ...payment,
                          expenseDetails
                        };
                      });

                      // Convert the map to an array and render
                      return Object.values(expenseMap).map(payment => {
                        const expenseId = payment.expenseId;
                        const expenseDetails = payment.expenseDetails;

                        return (
                          <View
                            key={payment.id || `${expenseId}_${receivable.userId}`}
                            style={[styles.newModalExpenseItem, {
                              borderBottomColor: themeColors.border
                            }]}
                          >
                          <View style={styles.newModalExpenseRow}>
                            <View style={styles.newModalExpenseInfo}>
                              <Text style={[styles.newModalExpenseTitle, { color: themeColors.text }]}>
                                {expenseDetails?.description || 'Expense'} {expenseDetails?.amount ? `(Total: ₹${parseFloat(expenseDetails.amount).toFixed(2)})` : ''}
                              </Text>
                              <Text style={[styles.newModalExpenseDate, { color: themeColors.textSecondary }]}>
                                {new Date(payment.date || payment.createdAt || expenseDetails?.date || new Date()).toLocaleDateString()}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={[styles.newModalExpenseAmount, { color: themeColors.success }]}>
                                ₹{(payment.splitAmount || payment.amount || receivable.amount / receivable.payments.length).toFixed(2)}
                              </Text>
                              <Text style={[styles.newModalExpenseSubtext, { color: themeColors.textSecondary }]}>
                                Your share
                              </Text>
                            </View>
                          </View>

                          {expenseDetails && (
                            <View style={styles.newModalExpenseTags}>
                              {expenseDetails.category && (
                                <View style={[styles.newModalExpenseTag, { backgroundColor: themeColors.primary.default + '15' }]}>
                                  <Icon
                                    name={getCategoryIcon(expenseDetails.category)}
                                    size={12}
                                    color={themeColors.primary.default}
                                  />
                                  <Text style={[styles.newModalExpenseTagText, { color: themeColors.primary.default }]}>
                                    {expenseDetails.category}
                                  </Text>
                                </View>
                              )}

                              {(expenseDetails.paidByName || expenseDetails.paidBy) && (
                                <View style={[styles.newModalExpenseTag, { backgroundColor: themeColors.textSecondary + '15' }]}>
                                  <Icon
                                    name="person-outline"
                                    size={12}
                                    color={themeColors.textSecondary}
                                  />
                                  <Text style={[styles.newModalExpenseTagText, { color: themeColors.textSecondary }]}>
                                    {expenseDetails.paidByName || (expenseDetails.paidBy === userProfile.id ? 'Me' : 'Unknown')}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                        );
                      });
                    })()}
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={styles.newModalEmptyState}>
              <Icon name="cash-outline" size={48} color={themeColors.textSecondary} />
              <Text style={[styles.newModalEmptyText, { color: themeColors.textSecondary }]}>
                No pending receivables
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* To Pay Details Modal - Simplified Design */}
      <Modal
        visible={payDetailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPayDetailsModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.surface }}>
          {/* Header */}
          <View style={[styles.newModalHeader, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity
              style={styles.newModalBackButton}
              onPress={() => setPayDetailsModalVisible(false)}
            >
              <Icon name="arrow-back" size={24} color={themeColors.primary.default} />
            </TouchableOpacity>
            <Text style={[styles.newModalTitle, { color: themeColors.text }]}>
              Pending Payments
            </Text>
            <View style={[styles.newModalTotalBadge, { backgroundColor: themeColors.danger + '15' }]}>
              <Text style={[styles.newModalTotalText, { color: themeColors.danger }]}>
                ₹{totalToPay.toFixed(2)}
              </Text>
            </View>
          </View>

          {pendingPayables.length > 0 ? (
            <FlatList
              data={pendingPayables}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.newModalList}
              renderItem={({ item: payment }) => (
                <View style={[styles.newModalUserCard, {
                  backgroundColor: themeColors.background + '50',
                  borderColor: themeColors.border
                }]}>
                  {/* User Info */}
                  <View style={styles.newModalUserInfo}>
                    <View style={styles.newModalUserAvatar}>
                      {payment.toUserAvatar ? (
                        <Image
                          source={{ uri: payment.toUserAvatar }}
                          style={styles.newModalAvatarImage}
                        />
                      ) : (
                        <View style={[styles.newModalAvatarPlaceholder, { backgroundColor: themeColors.primary.default }]}>
                          <Text style={styles.newModalAvatarText}>
                            {payment.toUserName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.newModalUserDetails}>
                      <Text style={[styles.newModalUserName, { color: themeColors.text }]}>
                        {payment.toUserName}
                      </Text>
                      <View style={styles.newModalAmountRow}>
                        <Icon name="arrow-up-circle" size={16} color={themeColors.danger} style={{ marginRight: 4 }} />
                        <Text style={[styles.newModalAmount, { color: themeColors.danger }]}>
                          ₹{payment.amount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.newModalStatusBadge, {
                      backgroundColor: themeColors.danger + '10',
                      borderColor: themeColors.danger + '30',
                    }]}>
                      <Icon name="time-outline" size={14} color={themeColors.danger} style={{ marginRight: 4 }} />
                      <Text style={[styles.newModalStatusText, { color: themeColors.danger }]}>
                        Pending
                      </Text>
                    </View>
                  </View>

                  {/* Expense Details */}
                  <View style={styles.newModalExpenseList}>
                    <Text style={[styles.newModalSectionTitle, { color: themeColors.text }]}>
                      Expense Details
                    </Text>

                    <View style={[styles.newModalExpenseItem, {
                      borderBottomColor: themeColors.border
                    }]}>
                      <View style={styles.newModalExpenseRow}>
                        <View style={styles.newModalExpenseInfo}>
                          <Text style={[styles.newModalExpenseTitle, { color: themeColors.text }]}>
                            {payment.expenseDetails?.description || 'Expense'}
                          </Text>
                          <Text style={[styles.newModalExpenseDate, { color: themeColors.textSecondary }]}>
                            {new Date(payment.date || payment.createdAt || new Date()).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={[styles.newModalExpenseAmount, { color: themeColors.danger }]}>
                          ₹{payment.amount.toFixed(2)}
                        </Text>
                      </View>

                      {payment.expenseDetails && (
                        <View style={styles.newModalExpenseTags}>
                          {payment.expenseDetails.category && (
                            <View style={[styles.newModalExpenseTag, { backgroundColor: themeColors.primary.default + '15' }]}>
                              <Icon
                                name={getCategoryIcon(payment.expenseDetails.category)}
                                size={12}
                                color={themeColors.primary.default}
                              />
                              <Text style={[styles.newModalExpenseTagText, { color: themeColors.primary.default }]}>
                                {payment.expenseDetails.category}
                              </Text>
                            </View>
                          )}

                          {(payment.expenseDetails.paidByName || payment.expenseDetails.paidBy) && (
                            <View style={[styles.newModalExpenseTag, { backgroundColor: themeColors.textSecondary + '15' }]}>
                              <Icon
                                name="person-outline"
                                size={12}
                                color={themeColors.textSecondary}
                              />
                              <Text style={[styles.newModalExpenseTagText, { color: themeColors.textSecondary }]}>
                                {payment.expenseDetails.paidByName || (payment.expenseDetails.paidBy === userProfile.id ? 'Me' : 'Unknown')}
                              </Text>
                            </View>
                          )}

                          {payment.expenseDetails.notes && (
                            <View style={[styles.newModalExpenseNotes, { backgroundColor: themeColors.background + '50' }]}>
                              <Text style={[styles.newModalExpenseNotesText, { color: themeColors.textSecondary }]} numberOfLines={2}>
                                {payment.expenseDetails.notes}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={styles.newModalEmptyState}>
              <Icon name="cash-outline" size={48} color={themeColors.textSecondary} />
              <Text style={[styles.newModalEmptyText, { color: themeColors.textSecondary }]}>
                No pending payments
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  // Summary Cards
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 16,
    marginHorizontal: spacing.xs,
  },
  summaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summarySubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  summaryIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },

  // Receivables Section
  receivablesContainer: {
    marginTop: spacing.md,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    marginRight: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  receivableItem: {
    padding: spacing.md,
    borderRadius: 16,
  },
  receivableContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receivableUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  receivableUserAvatar: {
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarImageLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholderLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextLarge: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  receivableUserDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  receivableUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  amountIcon: {
    marginRight: 4,
  },
  receivableAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  receiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    minWidth: 100,
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // Align to bottom for bottom sheet effect
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2, // Extra padding at bottom for safe area
  },
  modalHandleBar: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    marginTop: spacing.sm,
  },
  userInfoModalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  userInfoTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  amountBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  errorIcon: {
    marginRight: spacing.xs,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  optionsContainer: {
    marginTop: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonIcon: {
    marginRight: spacing.xs,
  },
  optionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  orText: {
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  customAmountContainer: {
    marginTop: spacing.sm,
  },
  customAmountLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 50,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    marginLeft: spacing.xs,
    fontSize: 16,
  },
  customButton: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Details Modal Styles
  detailsHeaderContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  detailsHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  detailsHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  detailsScrollView: {
    maxHeight: '70%',
  },
  detailsUserSection: {
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: spacing.md,
  },
  detailsUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailsUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsUserAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  detailsExpensesList: {
    marginTop: spacing.sm,
  },
  detailsExpenseItem: {
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
  },
  detailsExpenseContent: {
    width: '100%',
  },
  detailsExpenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  detailsExpenseInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  detailsExpenseTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsExpenseDate: {
    fontSize: 12,
    marginTop: 2,
  },
  detailsExpenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsExpenseMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  detailsExpenseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  detailsTagIcon: {
    marginRight: 4,
  },
  detailsTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  detailsExpenseNotes: {
    width: '100%',
    marginTop: spacing.xs,
  },
  detailsNotesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  detailsPaymentItem: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  detailsPaymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailsPaymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderWidth: 1,
  },
  detailsStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Receive Modal Styles
  receiveModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  receiveModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiveModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  receiveModalTotalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  receiveModalTotalText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },

  // User Tabs
  receiveModalUserTabs: {
    marginBottom: spacing.md,
  },
  receiveModalUserTabsContent: {
    paddingHorizontal: spacing.xs,
  },
  receiveModalUserTab: {
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    width: 80,
  },
  receiveModalUserTabAvatar: {
    marginBottom: spacing.xs,
  },
  receiveModalUserTabAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  receiveModalUserTabAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiveModalUserTabAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  receiveModalUserTabName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  receiveModalUserTabAmount: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Selected User
  receiveModalSelectedUser: {
    flex: 1,
    paddingBottom: 20, // Add padding to ensure content is not cut off
  },
  receiveModalSelectedUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  receiveModalSelectedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiveModalSelectedUserAvatar: {
    marginRight: spacing.md,
  },
  receiveModalSelectedUserAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  receiveModalSelectedUserAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiveModalSelectedUserAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  receiveModalSelectedUserDetails: {
    flex: 1,
  },
  receiveModalSelectedUserName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  receiveModalSelectedUserAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiveModalSelectedUserAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  receiveModalReceiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  receiveModalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // Expenses List
  receiveModalExpensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  receiveModalExpensesTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  receiveModalExpensesCount: {
    fontSize: 12,
  },
  receiveModalExpensesList: {
    flex: 1,
    maxHeight: 400, // Set a maximum height to ensure scrolling works
  },
  receiveModalExpenseItem: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  receiveModalExpenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  receiveModalExpenseInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  receiveModalExpenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  receiveModalExpenseSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiveModalExpenseDate: {
    fontSize: 12,
  },
  receiveModalExpenseAmountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  receiveModalExpenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  receiveModalExpenseDetails: {
    marginTop: spacing.sm,
  },
  receiveModalExpenseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  receiveModalExpenseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  receiveModalExpenseTagIcon: {
    marginRight: 4,
  },
  receiveModalExpenseTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  receiveModalExpenseNotes: {
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  receiveModalExpenseNotesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },

  // New Modal Styles
  newModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  newModalBackButton: {
    padding: spacing.xs,
  },
  newModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: spacing.sm,
  },
  newModalTotalBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  newModalTotalText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  newModalList: {
    padding: spacing.md,
  },
  newModalUserCard: {
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  newModalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  newModalUserAvatar: {
    marginRight: spacing.md,
  },
  newModalAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  newModalAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newModalAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  newModalUserDetails: {
    flex: 1,
  },
  newModalUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  newModalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newModalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  newModalReceiveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  newModalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  newModalExpenseList: {
    padding: spacing.md,
  },
  newModalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  newModalExpenseItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    marginBottom: spacing.sm,
  },
  newModalExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  newModalExpenseInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  newModalExpenseTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  newModalExpenseDate: {
    fontSize: 12,
  },
  newModalExpenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  newModalExpenseSubtext: {
    fontSize: 10,
    marginTop: 2,
  },
  newModalExpenseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  newModalExpenseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  newModalExpenseTagText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  newModalEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  newModalEmptyText: {
    fontSize: 16,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  newModalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  newModalStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  newModalExpenseNotes: {
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.xs,
    width: '100%',
  },
  newModalExpenseNotesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default PaymentSummary;
