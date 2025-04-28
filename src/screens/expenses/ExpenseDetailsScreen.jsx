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
  
  // Calculate amount per person
  const getAmountPerPerson = () => {
    if (!expense || !expense.amount || !expense.participants || expense.participants.length === 0) {
      return 0;
    }
    return expense.amount / expense.participants.length;
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
              <Text style={[styles.splitInfo, { color: themeColors.text }]}>
                Split equally among {participants.length || expense.participants?.length || 0} people
              </Text>
              
              <Text style={[styles.amountPerPerson, { color: themeColors.warning }]}>
                ₹{getAmountPerPerson().toFixed(2)} per person
              </Text>
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
                    
                    <View style={[styles.amountBadge, { backgroundColor: isDarkMode ? 'rgba(245, 54, 92, 0.2)' : 'rgba(245, 54, 92, 0.1)' }]}>
                      <Text style={[styles.participantAmount, { color: themeColors.danger }]}>
                        -₹{getAmountPerPerson().toFixed(2)}
                      </Text>
                    </View>
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
  splitInfo: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  amountPerPerson: {
    fontSize: 20,
    fontWeight: 'bold',
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
});

export default ExpenseDetailsScreen;
