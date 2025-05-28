import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/theme';

const BalanceDetailsModal = ({
  visible,
  onClose,
  title,
  balances,
  userProfile,
  getUserById,
  type // 'receive' or 'pay'
}) => {
  const { colors: themeColors, isDarkMode } = useTheme();

  // Filter balances based on type
  const filteredBalances = Object.entries(balances || {})
    .filter(([userId, balance]) => {
      if (userId === userProfile?.id) return false;
      
      if (type === 'receive') {
        // For receivables, show users with negative balances (they owe the current user)
        return balance < 0;
      } else {
        // For payables, show users with positive balances (current user owes them)
        return balance > 0;
      }
    })
    .map(([userId, balance]) => {
      const user = getUserById(userId);
      return {
        id: userId,
        name: user?.name || 'Unknown User',
        avatar: user?.avatar,
        amount: Math.abs(balance)
      };
    });

  // Calculate total amount
  const totalAmount = filteredBalances.reduce((sum, item) => sum + item.amount, 0);

  const renderItem = ({ item }) => (
    <View style={[styles.balanceItem, { backgroundColor: themeColors.surface }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatarContainer, { backgroundColor: themeColors.primary.default }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.userName, { color: themeColors.text }]}>{item.name}</Text>
      </View>
      <Text style={[
        styles.amount, 
        { color: type === 'receive' ? themeColors.success : themeColors.danger }
      ]}>
        {type === 'receive' ? '+' : '-'}₹{item.amount.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.modalContent, { backgroundColor: themeColors.surface }]}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              {title}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Total Amount */}
          <View style={[styles.totalContainer, { 
            backgroundColor: type === 'receive' ? themeColors.success + '15' : themeColors.danger + '15' 
          }]}>
            <View style={styles.totalContent}>
              <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>
                Total {type === 'receive' ? 'Receivable' : 'Payable'}
              </Text>
              <Text style={[
                styles.totalAmount, 
                { color: type === 'receive' ? themeColors.success : themeColors.danger }
              ]}>
                ₹{totalAmount.toFixed(2)}
              </Text>
              <Text style={[styles.totalSubtext, { color: themeColors.textSecondary }]}>
                {filteredBalances.length} {filteredBalances.length === 1 ? 'person' : 'people'} in this group
              </Text>
            </View>
          </View>

          {/* List of balances */}
          {filteredBalances.length > 0 ? (
            <FlatList
              data={filteredBalances}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon 
                name={type === 'receive' ? 'cash-outline' : 'wallet-outline'} 
                size={48} 
                color={themeColors.textSecondary} 
              />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No {type === 'receive' ? 'receivables' : 'payables'} to display
              </Text>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButtonBottom, { backgroundColor: themeColors.primary.default }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  totalContainer: {
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: 16,
  },
  totalContent: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  totalSubtext: {
    fontSize: 12,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  closeButtonBottom: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default BalanceDetailsModal;
