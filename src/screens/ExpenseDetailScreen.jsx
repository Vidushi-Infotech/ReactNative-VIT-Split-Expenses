import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import firebaseService from '../services/firebaseService';

const ExpenseDetailScreen = ({route, navigation}) => {
  const {expense, group} = route.params;
  const {theme} = useTheme();
  const {user} = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

  // Category mapping for display
  const categoryMapping = {
    1: {name: 'Food & Dining', emoji: '<}', color: '#FEF3C7'},
    2: {name: 'Transportation', emoji: '=�', color: '#FECACA'},
    3: {name: 'Shopping', emoji: '=�', color: '#E0E7FF'},
    4: {name: 'Entertainment', emoji: '<z', color: '#FED7AA'},
    5: {name: 'Movies', emoji: '<�', color: '#F3E8FF'},
    6: {name: 'Healthcare', emoji: '<�', color: '#FECACA'},
    7: {name: 'General', emoji: '=�', color: '#F3F4F6'},
    default: {name: 'Other', emoji: '=�', color: '#F3F4F6'},
  };

  useEffect(() => {
    loadExpenseDetails();
  }, []);

  const loadExpenseDetails = async () => {
    setLoading(true);
    try {
      // We already have expense data from props, just load group members
      setExpenseData(expense);

      // Load group members
      const members = await firebaseService.getGroupMembersWithProfiles(group.id);
      setGroupMembers(members);
    } catch (error) {
      console.error('Error loading expense details:', error);
      Alert.alert('Error', 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderParticipant = (participant) => {
    const member = groupMembers.find(m => m.userId === participant.userId);
    const isCurrentUser = participant.userId === user?.uid;
    
    return (
      <View key={participant.userId} style={styles.participantItem}>
        {member?.avatar ? (
          <Image source={{uri: member.avatar}} style={styles.participantAvatar} />
        ) : (
          <View style={styles.participantAvatarPlaceholder}>
            <Text style={styles.participantAvatarText}>
              {member?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>
            {member?.name || 'Unknown User'}
            {isCurrentUser ? ' (You)' : ''}
          </Text>
          <Text style={styles.participantEmail}>
            {member?.email || 'No email'}
          </Text>
        </View>
        <View style={styles.participantAmount}>
          <Text style={styles.participantAmountText}>
            ₹{participant.amount.toFixed(0)}
          </Text>
        </View>
      </View>
    );
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expense Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading expense details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentExpense = expenseData || expense;
  const category = categoryMapping[currentExpense.category?.id] || categoryMapping.default;
  const paidByMember = groupMembers.find(m => m.userId === currentExpense.paidBy);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Expense Header */}
        <View style={styles.expenseHeader}>
          <View style={[styles.categoryIcon, {backgroundColor: category.color}]}>
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseTitle}>{currentExpense.description}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.expenseDate}>{formatDate(currentExpense.createdAt)}</Text>
          </View>
          <View style={styles.expenseAmount}>
            <Text style={styles.expenseAmountText}>₹{currentExpense.amount.toFixed(0)}</Text>
          </View>
        </View>

        {/* Paid By Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paid By</Text>
          <View style={styles.paidByContainer}>
            {paidByMember?.avatar ? (
              <Image source={{uri: paidByMember.avatar}} style={styles.paidByAvatar} />
            ) : (
              <View style={styles.paidByAvatarPlaceholder}>
                <Text style={styles.paidByAvatarText}>
                  {paidByMember?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.paidByInfo}>
              <Text style={styles.paidByName}>
                {paidByMember?.name || 'Unknown User'}
                {currentExpense.paidBy === user?.uid ? ' (You)' : ''}
              </Text>
              <Text style={styles.paidByEmail}>
                {paidByMember?.email || 'No email'}
              </Text>
            </View>
          </View>
        </View>

        {/* Split Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Details</Text>
          <View style={styles.splitTypeContainer}>
            <MaterialIcons name="pie-chart" size={20} color={theme.colors.primary} />
            <Text style={styles.splitTypeText}>
              {currentExpense.splitType === 'equal' ? 'Split Equally' : 
               currentExpense.splitType === 'unequal' ? 'Split Unequally' :
               currentExpense.splitType === 'percentage' ? 'Split by Percentage' :
               currentExpense.splitType === 'shares' ? 'Split by Shares' : 'Custom Split'}
            </Text>
          </View>
        </View>

        {/* Participants Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants ({currentExpense.participants?.length || 0})</Text>
          {currentExpense.participants?.map(participant => renderParticipant(participant))}
        </View>

        {/* Receipt Section */}
        {currentExpense.receiptUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt</Text>
            <TouchableOpacity style={styles.receiptContainer}>
              <Image source={{uri: currentExpense.receiptUrl}} style={styles.receiptImage} />
              <View style={styles.receiptOverlay}>
                <Ionicons name="eye" size={24} color="#FFFFFF" />
                <Text style={styles.receiptText}>View Receipt</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes Section */}
        {currentExpense.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{currentExpense.notes}</Text>
          </View>
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
      borderRadius: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    headerRight: {
      width: 24,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    expenseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.colors.surface,
      marginBottom: 8,
    },
    categoryIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    categoryEmoji: {
      fontSize: 30,
    },
    expenseInfo: {
      flex: 1,
    },
    expenseTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    categoryName: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    expenseDate: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    expenseAmount: {
      alignItems: 'flex-end',
    },
    expenseAmountText: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    section: {
      backgroundColor: theme.colors.surface,
      marginVertical: 4,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    paidByContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    paidByAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
    },
    paidByAvatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    paidByAvatarText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    paidByInfo: {
      flex: 1,
    },
    paidByName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 4,
    },
    paidByEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    splitTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    splitTypeText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 8,
    },
    participantItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    participantAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    participantAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    participantAvatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    participantEmail: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    participantAmount: {
      alignItems: 'flex-end',
    },
    participantAmountText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    receiptContainer: {
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
    },
    receiptImage: {
      width: '100%',
      height: 200,
      resizeMode: 'cover',
    },
    receiptOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    receiptText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
      marginTop: 8,
    },
    notesText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
  });

export default ExpenseDetailScreen;