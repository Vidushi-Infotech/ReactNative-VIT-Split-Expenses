import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import { useTheme } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Avatar from '../common/Avatar';
import { spacing, fontSizes } from '../../theme/theme';

const SimpleExpenseModal = ({ isVisible, onClose, expense }) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  
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
  
  // Calculate amount per person
  const getAmountPerPerson = () => {
    if (!expense || !expense.amount || !expense.participants || expense.participants.length === 0) {
      return 0;
    }
    return expense.amount / expense.participants.length;
  };
  
  if (!expense || !expense.id) {
    return null;
  }
  
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.7}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: isDarkMode ? '#555555' : '#CCCCCC' }]} />
        </View>
        
        {/* Content */}
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              {expense.description}
            </Text>
            <Text style={[styles.amount, { color: themeColors.text }]}>
              ₹{expense.amount.toFixed(2)}
            </Text>
            <Text style={[styles.date, { color: themeColors.textSecondary }]}>
              {formatDate(expense.date)}
            </Text>
          </View>
          
          {/* Paid By */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
              Paid By
            </Text>
            <View style={styles.paidByContainer}>
              <Avatar
                source={expense.paidByUser?.avatar}
                name={expense.paidByUser?.name || 'User'}
                size="md"
              />
              <View style={styles.paidByInfo}>
                <Text style={[styles.paidByName, { color: themeColors.text }]}>
                  {expense.paidByUser?.name || 'Unknown User'}
                </Text>
                <Text style={[styles.paidByAmount, { color: themeColors.success }]}>
                  Paid ₹{expense.amount.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Split Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
              Split Details
            </Text>
            <View style={[styles.splitDetails, { backgroundColor: themeColors.background }]}>
              <Text style={[styles.splitInfo, { color: themeColors.text }]}>
                Split equally among {expense.participants?.length || 0} people
              </Text>
              <Text style={[styles.amountPerPerson, { color: themeColors.warning }]}>
                ₹{getAmountPerPerson().toFixed(2)} per person
              </Text>
            </View>
          </View>
          
          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: themeColors.primary.default }]}
            onPress={onClose}
          >
            <Icon name="close-outline" size={20} color="#FFFFFF" />
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '80%',
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  date: {
    fontSize: 14,
  },
  section: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  paidByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidByInfo: {
    marginLeft: spacing.md,
  },
  paidByName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paidByAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  splitDetails: {
    padding: spacing.md,
    borderRadius: 12,
  },
  splitInfo: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  amountPerPerson: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    margin: spacing.lg,
    marginTop: spacing.xl,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});

export default SimpleExpenseModal;
