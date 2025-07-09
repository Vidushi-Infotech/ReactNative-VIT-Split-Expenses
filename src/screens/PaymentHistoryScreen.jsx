import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import firebaseService from '../services/firebaseService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PaymentHistoryScreen = ({onClose}) => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'paid', 'received'

  useEffect(() => {
    if (user) {
      loadPaymentHistory();
    }
  }, [user]);

  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      console.log('💳 Loading payment history for user:', user?.uid);

      // Get all user's groups
      const userGroups = await firebaseService.getUserGroups(user.uid);
      console.log('💳 Found', userGroups.length, 'groups');

      const allPayments = [];

      // Get settlements from all groups
      for (const group of userGroups) {
        try {
          const groupSettlements = await firebaseService.getGroupSettlements(
            group.id,
          );
          const groupMembers =
            await firebaseService.getGroupMembersWithProfiles(group.id);

          console.log(
            '💳 Group',
            group.name,
            '- found',
            groupSettlements.length,
            'settlements',
          );

          groupSettlements.forEach(settlement => {
            const fromMember = groupMembers.find(
              m => m.userId === settlement.fromUserId,
            );
            const toMember = groupMembers.find(
              m => m.userId === settlement.toUserId,
            );

            // Only include payments where current user is involved
            if (
              settlement.fromUserId === user.uid ||
              settlement.toUserId === user.uid
            ) {
              const isPaid = settlement.fromUserId === user.uid;
              const isReceived = settlement.toUserId === user.uid;

              allPayments.push({
                id: settlement.id,
                type: isPaid ? 'paid' : 'received',
                amount: settlement.amount,
                date: settlement.settledAt?.toDate() || new Date(),
                groupId: group.id,
                groupName: group.name,
                groupCoverImage: group.coverImageUrl,
                fromUser: {
                  id: settlement.fromUserId,
                  name: fromMember?.name || 'Unknown User',
                  avatar: fromMember?.avatar,
                },
                toUser: {
                  id: settlement.toUserId,
                  name: toMember?.name || 'Unknown User',
                  avatar: toMember?.avatar,
                },
                description: settlement.description || 'Payment settlement',
                currency: settlement.currency || 'INR',
                isPaid,
                isReceived,
              });
            }
          });
        } catch (groupError) {
          console.error(
            '💳 Error loading settlements for group:',
            group.id,
            groupError,
          );
        }
      }

      // Sort by date (newest first)
      const sortedPayments = allPayments.sort((a, b) => b.date - a.date);

      console.log('💳 Loaded', sortedPayments.length, 'total payments');
      setPaymentHistory(sortedPayments);
    } catch (error) {
      console.error('💳 Error loading payment history:', error);
      Alert.alert('Error', 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPaymentHistory();
    } catch (error) {
      console.error('💳 Error refreshing payment history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = date => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const getFilteredPayments = () => {
    if (filterType === 'all') {
      return paymentHistory;
    } else if (filterType === 'paid') {
      return paymentHistory.filter(payment => payment.isPaid);
    } else if (filterType === 'received') {
      return paymentHistory.filter(payment => payment.isReceived);
    }
    return paymentHistory;
  };

  const generatePaymentSummary = () => {
    const totalPaid = paymentHistory
      .filter(p => p.isPaid)
      .reduce((sum, p) => sum + p.amount, 0);

    const totalReceived = paymentHistory
      .filter(p => p.isReceived)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPaid,
      totalReceived,
      netBalance: totalReceived - totalPaid,
      totalTransactions: paymentHistory.length,
    };
  };

  const shareIndividualPayment = async payment => {
    try {
      const otherUser = payment.isPaid
        ? payment.toUser.name
        : payment.fromUser.name;
      const action = payment.isPaid ? 'Paid to' : 'Received from';
      const amountSymbol = payment.isPaid ? '-' : '+';

      let shareText = `💰 Payment Transaction - Splitzy\n\n`;
      shareText += `📄 Transaction Details:\n`;
      shareText += `• ${action}: ${otherUser}\n`;
      shareText += `• Amount: ${amountSymbol}₹${payment.amount.toFixed(2)}\n`;
      shareText += `• Group: ${payment.groupName}\n`;
      shareText += `• Date: ${formatDate(payment.date)}\n`;

      if (payment.description && payment.description !== 'Payment settlement') {
        shareText += `• Description: ${payment.description}\n`;
      }

      shareText += `\n💡 Transaction ID: ${payment.id}\n`;
      shareText += `\n🚀 Manage expenses easily with Splitzy app!`;

      await Share.share({
        message: shareText,
        title: `Payment ${payment.isPaid ? 'Sent' : 'Received'} - Splitzy`,
      });
    } catch (error) {
      console.error('Error sharing payment:', error);
      Alert.alert('Error', 'Failed to share payment details');
    }
  };

  const filteredPayments = getFilteredPayments();
  const summary = generatePaymentSummary();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryAmount, {color: '#F59E0B'}]}>
            ₹{summary.totalPaid.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Received</Text>
          <Text style={[styles.summaryAmount, {color: '#10B981'}]}>
            ₹{summary.totalReceived.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Net Balance</Text>
          <Text
            style={[
              styles.summaryAmount,
              {color: summary.netBalance >= 0 ? '#10B981' : '#F59E0B'},
            ]}>
            ₹{Math.abs(summary.netBalance).toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterType === 'all' && styles.activeFilterTab,
          ]}
          onPress={() => setFilterType('all')}>
          <Text
            style={[
              styles.filterText,
              filterType === 'all' && styles.activeFilterText,
            ]}>
            All ({paymentHistory.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterType === 'paid' && styles.activeFilterTab,
          ]}
          onPress={() => setFilterType('paid')}>
          <Text
            style={[
              styles.filterText,
              filterType === 'paid' && styles.activeFilterText,
            ]}>
            Paid ({paymentHistory.filter(p => p.isPaid).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterType === 'received' && styles.activeFilterTab,
          ]}
          onPress={() => setFilterType('received')}>
          <Text
            style={[
              styles.filterText,
              filterType === 'received' && styles.activeFilterText,
            ]}>
            Received ({paymentHistory.filter(p => p.isReceived).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment History List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading payment history...</Text>
          </View>
        ) : filteredPayments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="payment"
              size={64}
              color={theme.colors.textMuted}
            />
            <Text style={styles.emptyText}>No payment history</Text>
            <Text style={styles.emptySubtext}>
              {filterType === 'all'
                ? 'Your payment transactions will appear here'
                : `No ${filterType} payments found`}
            </Text>
          </View>
        ) : (
          filteredPayments.map(payment => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View
                  style={[
                    styles.paymentIcon,
                    {backgroundColor: payment.isPaid ? '#FEF3C7' : '#D1FAE5'},
                  ]}>
                  <MaterialIcons
                    name={payment.isPaid ? 'arrow-upward' : 'arrow-downward'}
                    size={24}
                    color={payment.isPaid ? '#F59E0B' : '#10B981'}
                  />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>
                    {payment.isPaid ? 'Paid to' : 'Received from'}{' '}
                    {payment.isPaid
                      ? payment.toUser.name
                      : payment.fromUser.name}
                  </Text>
                  <Text style={styles.paymentGroup}>
                    in {payment.groupName}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {formatDate(payment.date)}
                  </Text>
                </View>
                <View style={styles.paymentAmount}>
                  <Text
                    style={[
                      styles.amountText,
                      {color: payment.isPaid ? '#F59E0B' : '#10B981'},
                    ]}>
                    {payment.isPaid ? '-' : '+'}₹{payment.amount.toFixed(0)}
                  </Text>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => shareIndividualPayment(payment)}
                    activeOpacity={0.6}>
                    <Ionicons
                      name="share-outline"
                      size={22}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {payment.description &&
                payment.description !== 'Payment settlement' && (
                  <Text style={styles.paymentDescription}>
                    {payment.description}
                  </Text>
                )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    headerSpacer: {
      width: 40,
    },
    summaryContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    summaryCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      fontWeight: '500',
    },
    summaryAmount: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    activeFilterTab: {
      backgroundColor: theme.colors.primary,
    },
    filterText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    activeFilterText: {
      color: '#FFFFFF',
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginTop: 8,
      textAlign: 'center',
    },
    paymentCard: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginVertical: 6,
      padding: 16,
      borderRadius: 12,
      shadowColor: theme.colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    paymentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    paymentIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    paymentGroup: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    paymentDate: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    paymentAmount: {
      alignItems: 'flex-end',
    },
    amountText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    shareButton: {
      padding: 10,
      borderRadius: 18,
      backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}15`,
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
      marginTop: 2,
    },
    paymentDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
    },
  });

export default PaymentHistoryScreen;
