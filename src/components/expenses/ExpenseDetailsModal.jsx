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
  Dimensions,
} from 'react-native';
import ReactNativeModal from 'react-native-modal';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';
import Avatar from '../common/Avatar';
import UserService from '../../services/UserService';

const ExpenseDetailsModal = ({ isVisible, onClose, expense }) => {
  const { isDarkMode, colors: themeColors } = useTheme();
  const { userProfile } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [paidByUser, setPaidByUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = React.useRef(null);

  // Modal for displaying expense details
  console.log('ExpenseDetailsModal render - isVisible:', isVisible, 'expense:', expense?.id);

  useEffect(() => {
    console.log('ExpenseDetailsModal useEffect - isVisible:', isVisible, 'expense:', expense?.id);
    if (isVisible && expense) {
      loadExpenseDetails();
    }
  }, [isVisible, expense]);

  // Add a separate effect to log when the modal becomes visible
  useEffect(() => {
    if (isVisible) {
      console.log('Modal became visible');
      // Reset scroll position when modal opens
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      }
    } else {
      console.log('Modal became hidden');
    }
  }, [isVisible]);

  const loadExpenseDetails = async () => {
    if (!expense) return;

    setLoading(true);

    try {
      // Use the paidByUser from the expense object if available, otherwise fetch it
      if (expense.paidByUser) {
        setPaidByUser(expense.paidByUser);
      } else if (expense.paidBy) {
        const paidByUserData = await UserService.getUserById(expense.paidBy);
        setPaidByUser(paidByUserData);
      }

      // Fetch user details for all participants
      if (expense.participants && expense.participants.length > 0) {
        const participantPromises = expense.participants.map(async (userId) => {
          try {
            const userData = await UserService.getUserById(userId);
            return {
              ...userData,
              isCurrentUser: userId === userProfile?.id
            };
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return {
              id: userId,
              name: 'Unknown User',
              isCurrentUser: userId === userProfile?.id
            };
          }
        });

        const participantDetails = await Promise.all(participantPromises);
        setParticipants(participantDetails);
      }
    } catch (error) {
      console.error('Error fetching expense details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate amount per person
  const getAmountPerPerson = () => {
    if (!expense || !expense.amount || !expense.participants || expense.participants.length === 0) {
      return 0;
    }

    return expense.amount / expense.participants.length;
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Food': 'restaurant',
      'Transport': 'car',
      'Shopping': 'cart',
      'Entertainment': 'film',
      'Groceries': 'basket',
      'Bills': 'receipt',
      'Travel': 'airplane',
      'Health': 'medical',
      'Education': 'school',
      'Other': 'apps',
    };

    return iconMap[category] || 'apps';
  };

  // Check if expense is valid (has an id)
  const validExpense = expense && expense.id;

  // If no valid expense but modal is visible, show loading state
  const showLoading = isVisible && !validExpense;

  // If not visible at all, return null
  if (!isVisible && !validExpense) {
    return null;
  }

  // Ready to render the modal

  return (
    <ReactNativeModal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      backdropOpacity={0.7}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={300}
      useNativeDriver={true}
      useNativeDriverForBackdrop={true}
      statusBarTranslucent={true}
      hasBackdrop={true}
      coverScreen={true}
      onModalShow={() => console.log('Modal is now visible')}
    >
      <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: isDarkMode ? '#555555' : '#CCCCCC' }]} />
        </View>

        {loading || showLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary.default} />
            <Text style={[styles.loadingText, { color: themeColors.text }]}>
              Loading expense details...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
            bounces={true}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
            ref={scrollViewRef}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.categoryBadge, { backgroundColor: themeColors.primary.light }]}>
                <Icon
                  name={getCategoryIcon(expense.category)}
                  size={24}
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
            <View style={[styles.section, { borderBottomColor: themeColors.border }]}>
              <View style={styles.sectionHeaderRow}>
                <Icon
                  name="wallet-outline"
                  size={18}
                  color={themeColors.textSecondary}
                  style={styles.sectionIcon}
                />
                <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
                  Paid by
                </Text>
              </View>

              {paidByUser ? (
                <View style={styles.paidByContainer}>
                  <Avatar
                    source={paidByUser.avatar}
                    name={paidByUser.name || 'User'}
                    size="md"
                  />

                  <View style={styles.paidByInfo}>
                    <Text style={[styles.paidByName, { color: themeColors.text }]}>
                      {paidByUser.id === userProfile?.id ? 'Me' : paidByUser.name || 'Unknown User'}
                    </Text>

                    <Text style={[styles.paidByAmount, { color: themeColors.success }]}>
                      Paid ₹{parseFloat(expense.amount).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ) : expense.paidBy ? (
                <View style={styles.paidByContainer}>
                  <Avatar
                    name={expense.paidBy === userProfile?.id ? userProfile.name : 'User'}
                    size="md"
                  />

                  <View style={styles.paidByInfo}>
                    <Text style={[styles.paidByName, { color: themeColors.text }]}>
                      {expense.paidBy === userProfile?.id ? 'Me' : `User ${typeof expense.paidBy === 'string' ? expense.paidBy.substring(0, 5) : ''}...`}
                    </Text>

                    <Text style={[styles.paidByAmount, { color: themeColors.success }]}>
                      Paid ₹{parseFloat(expense.amount).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.noParticipantsText, { color: themeColors.textSecondary }]}>
                  No payer information available
                </Text>
              )}
            </View>

            {/* Split Details Section */}
            <View style={[styles.section, { borderBottomColor: themeColors.border }]}>
              <View style={styles.sectionHeaderRow}>
                <Icon
                  name="pie-chart-outline"
                  size={18}
                  color={themeColors.textSecondary}
                  style={styles.sectionIcon}
                />
                <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
                  Split Details
                </Text>
              </View>

              <View style={styles.splitDetailsContainer}>
                <Text style={[styles.splitInfo, { color: themeColors.text }]}>
                  Split equally among {participants.length || expense.participants?.length || 0} people
                </Text>

                <Text style={[styles.amountPerPerson, { color: themeColors.warning }]}>
                  ₹{getAmountPerPerson().toFixed(2)} per person
                </Text>
              </View>
            </View>

            {/* Participants Section */}
            <View style={[styles.section, expense.image ? { borderBottomColor: themeColors.border } : {}]}>
              <View style={styles.sectionHeaderRow}>
                <Icon
                  name="people-outline"
                  size={18}
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
                          size="sm"
                        />

                        <Text style={[styles.participantName, { color: themeColors.text }]}>
                          {participant.isCurrentUser ? 'Me' : participant.name || 'Unknown User'}
                        </Text>
                      </View>

                      <View style={[styles.amountBadge, { backgroundColor: isDarkMode ? 'rgba(245, 54, 92, 0.2)' : 'rgba(245, 54, 92, 0.1)' }]}>
                        <Text style={[styles.participantAmount, { color: themeColors.danger }]}>
                          -₹{getAmountPerPerson().toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : expense.participants && expense.participants.length > 0 ? (
                  // Fallback to just showing participant IDs if we don't have full user details yet
                  expense.participants.map((participantId) => (
                    <View key={participantId} style={styles.participantItem}>
                      <View style={styles.participantInfo}>
                        <Avatar
                          name={participantId === userProfile?.id ? userProfile.name : 'User'}
                          size="sm"
                        />

                        <Text style={[styles.participantName, { color: themeColors.text }]}>
                          {participantId === userProfile?.id ? 'Me' : `User ${typeof participantId === 'string' ? participantId.substring(0, 5) : ''}...`}
                        </Text>
                      </View>

                      <View style={[styles.amountBadge, { backgroundColor: isDarkMode ? 'rgba(245, 54, 92, 0.2)' : 'rgba(245, 54, 92, 0.1)' }]}>
                        <Text style={[styles.participantAmount, { color: themeColors.danger }]}>
                          -₹{getAmountPerPerson().toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.noParticipantsText, { color: themeColors.textSecondary }]}>
                    No participants information available
                  </Text>
                )}
              </View>
            </View>

            {/* Receipt Image Section */}
            {expense.image && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Icon
                    name="receipt-outline"
                    size={18}
                    color={themeColors.textSecondary}
                    style={styles.sectionIcon}
                  />
                  <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
                    Receipt
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.receiptContainer}
                  onPress={() => {
                    // Implement full screen image view if needed
                  }}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: expense.image }}
                    style={styles.receiptImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: themeColors.primary.default }]}
              onPress={() => {
                console.log('Close button pressed');
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Icon name="close-outline" size={20} color="#FFFFFF" style={styles.closeIcon} />
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </ReactNativeModal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%', // Reduced height to ensure it fits on screen
    backgroundColor: '#FFFFFF', // Explicit white background color
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Account for bottom safe area on iOS
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  handleContainer: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    flexGrow: 1,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  expenseTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  expenseAmount: {
    fontSize: fontSizes.xxxl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  expenseDate: {
    fontSize: fontSizes.sm,
    opacity: 0.8,
  },
  section: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    marginRight: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paidByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  paidByInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  paidByName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  paidByAmount: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  splitDetailsContainer: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.01)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  splitInfo: {
    fontSize: fontSizes.md,
    marginBottom: spacing.md,
  },
  amountPerPerson: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  participantsList: {
    marginTop: spacing.md,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantName: {
    fontSize: fontSizes.md,
    marginLeft: spacing.md,
    fontWeight: '500',
  },
  amountBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  participantAmount: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  noParticipantsText: {
    fontSize: fontSizes.md,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: spacing.md,
    opacity: 0.7,
  },
  receiptContainer: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  closeIcon: {
    marginRight: spacing.xs,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: fontSizes.md,
  },
});

export default ExpenseDetailsModal;
