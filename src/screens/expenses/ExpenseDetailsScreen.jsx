import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';
import Avatar from '../../components/common/Avatar';
import UserService from '../../services/UserService';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

const ExpenseDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDarkMode, colors: themeColors } = useTheme();
  const { userProfile } = useAuth();

  const { expense } = route.params || {};
  const [participants, setParticipants] = useState([]);
  const [paidByUser, setPaidByUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (expense) {
      loadExpenseDetails();
    } else {
      setLoading(false);
    }
  }, [expense]);

  const loadExpenseDetails = async () => {
    setLoading(true);

    try {
      // Use the paidByUser from the expense object if available, otherwise fetch it
      if (expense.paidByUser) {
        setPaidByUser(expense.paidByUser);
      } else if (expense.paidBy) {
        const paidByUserData = await UserService.getUserById(expense.paidBy);
        setPaidByUser(paidByUserData);
      }

      // Fetch participant details if needed
      if (expense.participants && expense.participants.length > 0) {
        const participantsData = await Promise.all(
          expense.participants.map(async (participantId) => {
            // Check if this is the current user
            const isCurrentUser = participantId === userProfile?.id;

            // If we already have user data in the expense object, use it
            if (expense.participantsData && expense.participantsData[participantId]) {
              return {
                ...expense.participantsData[participantId],
                isCurrentUser
              };
            }

            // Otherwise fetch the user data
            try {
              const userData = await UserService.getUserById(participantId);
              return {
                ...userData,
                isCurrentUser
              };
            } catch (error) {
              console.error(`Error fetching user ${participantId}:`, error);
              return {
                id: participantId,
                name: 'Unknown User',
                avatar: null,
                isCurrentUser
              };
            }
          })
        );

        setParticipants(participantsData);
      }
    } catch (error) {
      console.error('Error loading expense details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Food':
        return 'restaurant-outline';
      case 'Transport':
      case 'Transportation':
        return 'car-outline';
      case 'Accommodation':
        return 'bed-outline';
      case 'Entertainment':
        return 'film-outline';
      case 'Utilities':
        return 'flash-outline';
      case 'Shopping':
        return 'cart-outline';
      case 'Groceries':
        return 'basket-outline';
      case 'Bills':
        return 'receipt-outline';
      case 'Travel':
        return 'airplane-outline';
      case 'Health':
        return 'medical-outline';
      case 'Education':
        return 'school-outline';
      default:
        return 'cash-outline';
    }
  };

  // Get split type display name
  const getSplitTypeDisplay = () => {
    const splitType = expense.splitType || 'equal';
    switch (splitType) {
      case 'equal':
        return 'Equal Split';
      case 'unequal':
        return 'Unequal Split';
      case 'group':
        return 'Group Split';
      default:
        return 'Equal Split';
    }
  };

  // Get split type icon
  const getSplitTypeIcon = () => {
    const splitType = expense.splitType || 'equal';
    switch (splitType) {
      case 'equal':
        return 'reorder-four-outline';
      case 'unequal':
        return 'options-outline';
      case 'group':
        return 'people-outline';
      default:
        return 'reorder-four-outline';
    }
  };

  // Calculate amount per person based on split type
  const getAmountPerPerson = () => {
    if (!expense || !expense.amount || !expense.participants || expense.participants.length === 0) {
      return 0;
    }

    // Default to equal split
    return expense.amount / expense.participants.length;
  };

  // Get participant share based on split type
  const getParticipantShare = (participantId) => {
    if (!expense || !expense.amount || !expense.participants || expense.participants.length === 0) {
      return 0;
    }

    const splitType = expense.splitType || 'equal';

    if (splitType === 'unequal') {
      // For unequal split, first try to use the custom amounts if available
      if (expense.customAmounts && expense.customAmounts[participantId] !== undefined) {
        return expense.customAmounts[participantId];
      }
      // Fall back to calculating from percentages if amounts not available
      else if (expense.customSplits && expense.customSplits[participantId] !== undefined) {
        const percentage = expense.customSplits[participantId];
        return (expense.amount * percentage) / 100;
      }
    } else if (splitType === 'group') {
      // For group split (not fully implemented yet, fallback to equal)
      return expense.amount / expense.participants.length;
    }

    // Default: Equal split
    return expense.amount / expense.participants.length;
  };

  // Calculate participant balance
  const getParticipantBalance = (participantId) => {
    if (!expense || !expense.amount || !expense.participants || expense.participants.length === 0) {
      return 0;
    }

    const share = getParticipantShare(participantId);

    // If this participant is the payer
    if (participantId === expense.paidBy) {
      // Calculate how much they paid minus their share
      return expense.amount - share;
    } else {
      // They owe their share
      return -share;
    }
  };

  // Get participant percentage for unequal splits
  const getParticipantPercentage = (participantId) => {
    if (!expense || expense.splitType !== 'unequal' || !expense.customSplits) {
      return 0;
    }

    return expense.customSplits[participantId] || 0;
  };

  // Get exact custom amount for unequal splits
  const getParticipantCustomAmount = (participantId) => {
    if (!expense || expense.splitType !== 'unequal' || !expense.customAmounts) {
      return null;
    }

    return expense.customAmounts[participantId] !== undefined ?
      expense.customAmounts[participantId] : null;
  };

  if (!expense) {
    return (
      <SafeAreaWrapper>
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: themeColors.surface }]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              Expense Details
            </Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.centerContainer}>
            <Icon name="alert-circle-outline" size={60} color={themeColors.danger} />
            <Text style={[styles.errorText, { color: themeColors.text }]}>
              Expense not found
            </Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: themeColors.surface }]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              Expense Details
            </Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={themeColors.primary.default} />
            <Text style={[styles.loadingText, { color: themeColors.text }]}>
              Loading expense details...
            </Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: themeColors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Expense Details
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Expense Header */}
          <View style={[styles.expenseHeader, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.categoryBadge, { backgroundColor: themeColors.primary.light + '20' }]}>
              <Icon
                name={getCategoryIcon(expense.category)}
                size={28}
                color={themeColors.primary.default}
              />
              <Text style={[styles.categoryText, { color: themeColors.primary.default }]}>
                {expense.category || 'Other'}
              </Text>
            </View>

            <Text style={[styles.expenseTitle, { color: themeColors.text }]}>
              {expense.description}
            </Text>

            <Text style={[styles.expenseAmount, { color: themeColors.text }]}>
              ₹{parseFloat(expense.amount).toFixed(2)}
            </Text>

            <Text style={[styles.expenseDate, { color: themeColors.textSecondary }]}>
              {formatDate(expense.date)}
            </Text>
          </View>

          {/* Paid By Section */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <View style={styles.sectionHeader}>
              <Icon
                name="wallet-outline"
                size={20}
                color={themeColors.textSecondary}
                style={styles.sectionIcon}
              />
              <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
                Paid by
              </Text>
            </View>

            <View style={styles.paidByContainer}>
              {paidByUser ? (
                <>
                  <Avatar
                    source={paidByUser.avatar}
                    name={paidByUser.name || 'User'}
                    size="lg"
                  />

                  <View style={styles.paidByInfo}>
                    <Text style={[styles.paidByName, { color: themeColors.text }]}>
                      {paidByUser.id === userProfile?.id ? 'Me' : paidByUser.name || 'Unknown User'}
                    </Text>

                    <Text style={[styles.paidByAmount, { color: themeColors.success }]}>
                      Paid ₹{parseFloat(expense.amount).toFixed(2)}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={[styles.noDataText, { color: themeColors.textSecondary }]}>
                  Paid by unknown user
                </Text>
              )}
            </View>
          </View>

          {/* Split Details Section */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <View style={styles.sectionHeader}>
              <Icon
                name="pie-chart-outline"
                size={20}
                color={themeColors.textSecondary}
                style={styles.sectionIcon}
              />
              <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
                Split Details
              </Text>
            </View>

            <View style={styles.splitDetailsContainer}>
              {/* Split Type Badge */}
              <View style={[styles.splitTypeBadge, { backgroundColor: themeColors.primary.light + '20' }]}>
                <Icon
                  name={getSplitTypeIcon()}
                  size={20}
                  color={themeColors.primary.default}
                />
                <Text style={[styles.splitTypeText, { color: themeColors.primary.default }]}>
                  {getSplitTypeDisplay()}
                </Text>
              </View>

              {/* Split Description */}
              <Text style={[styles.splitInfo, { color: themeColors.text }]}>
                {expense.splitType === 'unequal'
                  ? 'Split based on custom percentages'
                  : expense.splitType === 'group'
                    ? 'Split by group'
                    : `Split equally among ${participants.length || expense.participants?.length || 0} people`
                }
              </Text>

              {/* Only show per person amount for equal splits */}
              {(!expense.splitType || expense.splitType === 'equal') && (
                <Text style={[styles.amountPerPerson, { color: themeColors.warning }]}>
                  ₹{getAmountPerPerson().toFixed(2)} per person
                </Text>
              )}

              <View style={styles.splitSummaryContainer}>
                <View style={[styles.splitSummaryCard, { backgroundColor: themeColors.primary.light + '15' }]}>
                  <Icon name="calculator-outline" size={20} color={themeColors.primary.default} />
                  <Text style={[styles.splitSummaryTitle, { color: themeColors.textSecondary }]}>
                    Total Expense
                  </Text>
                  <Text style={[styles.splitSummaryValue, { color: themeColors.text }]}>
                    ₹{parseFloat(expense.amount).toFixed(2)}
                  </Text>
                </View>

                <View style={[styles.splitSummaryCard, { backgroundColor: themeColors.success + '15' }]}>
                  <Icon name="people-outline" size={20} color={themeColors.success} />
                  <Text style={[styles.splitSummaryTitle, { color: themeColors.textSecondary }]}>
                    Participants
                  </Text>
                  <Text style={[styles.splitSummaryValue, { color: themeColors.text }]}>
                    {participants.length || expense.participants?.length || 0}
                  </Text>
                </View>

                <View style={[styles.splitSummaryCard, { backgroundColor: themeColors.warning + '15' }]}>
                  <Icon
                    name={expense.splitType === 'unequal' ? 'options-outline' : 'person-outline'}
                    size={20}
                    color={themeColors.warning}
                  />
                  <Text style={[styles.splitSummaryTitle, { color: themeColors.textSecondary }]}>
                    {expense.splitType === 'unequal' ? 'Split Type' : 'Per Person'}
                  </Text>
                  <Text style={[styles.splitSummaryValue, { color: themeColors.text }]}>
                    {expense.splitType === 'unequal' ? 'Custom' : `₹${getAmountPerPerson().toFixed(2)}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Participants Section */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <View style={styles.sectionHeader}>
              <Icon
                name="people-outline"
                size={20}
                color={themeColors.textSecondary}
                style={styles.sectionIcon}
              />
              <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
                Participants
              </Text>
            </View>

            <View style={styles.participantsList}>
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <View key={participant.id} style={styles.participantItem}>
                    <View style={styles.participantInfo}>
                      <Avatar
                        source={participant.avatar}
                        name={participant.name || 'User'}
                        size="md"
                      />

                      <Text style={[styles.participantName, { color: themeColors.text }]}>
                        {participant.isCurrentUser ? 'Me' : participant.name || 'Unknown User'}
                      </Text>
                    </View>

                    {participant.id === expense.paidBy ? (
                      <View style={[styles.amountBadge, { backgroundColor: isDarkMode ? 'rgba(39, 174, 96, 0.2)' : 'rgba(39, 174, 96, 0.1)' }]}>
                        <Text style={[styles.participantAmount, { color: themeColors.success }]}>
                          +₹{(expense.amount - getParticipantShare(participant.id)).toFixed(2)}
                        </Text>
                        {expense.splitType === 'unequal' && (
                          <View>
                            <Text style={[styles.participantCustomAmount, { color: themeColors.success }]}>
                              Share: ₹{getParticipantShare(participant.id).toFixed(2)}
                            </Text>
                            <Text style={[styles.participantPercentage, { color: themeColors.success }]}>
                              ({getParticipantPercentage(participant.id).toFixed(2)}%)
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={[styles.amountBadge, { backgroundColor: isDarkMode ? 'rgba(245, 54, 92, 0.2)' : 'rgba(245, 54, 92, 0.1)' }]}>
                        <Text style={[styles.participantAmount, { color: themeColors.danger }]}>
                          -₹{getParticipantShare(participant.id).toFixed(2)}
                        </Text>
                        {expense.splitType === 'unequal' && (
                          <View>
                            <Text style={[styles.participantCustomAmount, { color: themeColors.danger }]}>
                              Share: ₹{getParticipantShare(participant.id).toFixed(2)}
                            </Text>
                            <Text style={[styles.participantPercentage, { color: themeColors.danger }]}>
                              ({getParticipantPercentage(participant.id).toFixed(2)}%)
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={[styles.noDataText, { color: themeColors.textSecondary }]}>
                  No participants information available
                </Text>
              )}
            </View>
          </View>

          {/* Notes Section */}
          {expense.notes && (
            <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="document-text-outline"
                  size={20}
                  color={themeColors.textSecondary}
                  style={styles.sectionIcon}
                />
                <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
                  Notes
                </Text>
              </View>

              <Text style={[styles.notesText, { color: themeColors.text }]}>
                {expense.notes}
              </Text>
            </View>
          )}

          {/* Receipt Image Section */}
          {expense.image && (
            <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="image-outline"
                  size={20}
                  color={themeColors.textSecondary}
                  style={styles.sectionIcon}
                />
                <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
                  Receipt
                </Text>
              </View>

              <Image
                source={{ uri: expense.image }}
                style={styles.receiptImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
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
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.lg,
    fontSize: 16,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: spacing.lg,
  },
  expenseHeader: {
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  expenseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  expenseAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  expenseDate: {
    fontSize: 14,
  },
  section: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  paidByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidByInfo: {
    marginLeft: spacing.lg,
  },
  paidByName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  paidByAmount: {
    fontSize: 16,
    fontWeight: '500',
  },
  splitDetailsContainer: {
    alignItems: 'center',
  },
  splitTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  splitTypeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  splitInfo: {
    fontSize: 16,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  amountPerPerson: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  participantPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  participantCustomAmount: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  participantsList: {
    marginTop: spacing.sm,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    marginLeft: spacing.md,
    fontSize: 16,
    fontWeight: '500',
  },
  amountBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  participantAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  noDataText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  bottomSpacing: {
    height: 40,
  },
  splitSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  splitSummaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  splitSummaryTitle: {
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  splitSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExpenseDetailsScreen;
