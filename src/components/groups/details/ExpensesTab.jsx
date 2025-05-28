import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Animated, {
  FadeInDown,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring
} from 'react-native-reanimated';
import ExpenseCard from '../../expenses/ExpenseCard.jsx';
import EmptyState from './EmptyState.jsx';
import { useTheme } from '../../../context/ThemeContext.jsx';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './GroupDetailsStyles';

const ExpensesTab = ({ expenses, getUserById, onExpensePress, handleAddExpense }) => {
  const { colors: themeColors } = useTheme();
  const headerScale = useSharedValue(0.95);

  // Categories to group expenses
  const categories = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(expense);
    return acc;
  }, {});

  // Sort categories by total amount
  const sortedCategories = Object.keys(categories).sort((a, b) => {
    const totalA = categories[a].reduce((sum, exp) => sum + exp.amount, 0);
    const totalB = categories[b].reduce((sum, exp) => sum + exp.amount, 0);
    return totalB - totalA;
  });

  useEffect(() => {
    // Animate header on mount
    headerScale.value = withSequence(
      withDelay(300, withTiming(1.02, { duration: 300 })),
      withSpring(1)
    );
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: headerScale.value }]
    };
  });

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon="receipt-outline"
        title="No Expenses Yet"
        description="Add your first expense to start tracking."
        buttonText="Add Expense"
        onButtonPress={handleAddExpense}
      />
    );
  }

  // We're removing the recent expenses section as requested

  return (
    <View style={styles.expensesContainer}>

      {/* Category Sections */}
      {sortedCategories.map((category, categoryIndex) => {
        const categoryExpenses = categories[category];
        const totalAmount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Get icon based on category
        const getCategoryIcon = () => {
          switch(category.toLowerCase()) {
            case 'food': return 'restaurant-outline';
            case 'transport': return 'car-outline';
            case 'shopping': return 'cart-outline';
            case 'entertainment': return 'film-outline';
            case 'utilities': return 'flash-outline';
            case 'rent': return 'home-outline';
            case 'travel': return 'airplane-outline';
            case 'health': return 'medical-outline';
            default: return 'pricetag-outline';
          }
        };

        return (
          <View key={category}>
            <Animated.View
              style={[styles.sectionHeader, { marginTop: categoryIndex === 0 ? 0 : 24 }]}
              entering={FadeInDown.delay(100 + categoryIndex * 100).duration(400)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: themeColors.primary.default + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Icon
                      name={getCategoryIcon()}
                      size={20}
                      color={themeColors.primary.default}
                    />
                  </View>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                    {category}
                  </Text>
                </View>
                <Text style={{
                  fontWeight: 'bold',
                  color: themeColors.text,
                  fontSize: 18
                }}>
                  ₹{totalAmount.toFixed(0)}
                </Text>
              </View>
            </Animated.View>

            {categoryExpenses.slice(0, 3).map((expense, index) => {
              const paidByUser = getUserById(expense.paidBy);
              const expenseWithUser = {
                ...expense,
                paidByUser: paidByUser,
                description: expense.description || 'Unnamed Expense',
                amount: expense.amount || 0,
                date: expense.date || new Date().toISOString(),
                category: expense.category || 'Other',
                participants: expense.participants || []
              };

              return (
                <Animated.View
                  key={expense.id}
                  entering={SlideInRight.delay((100 + categoryIndex * 100) + (index * 100)).duration(400)}
                  style={styles.expenseCardContainer}
                >
                  <ExpenseCard
                    expense={expenseWithUser}
                    onPress={() => {
                      if (typeof onExpensePress === 'function') {
                        onExpensePress(expenseWithUser);
                      }
                    }}
                  />
                </Animated.View>
              );
            })}

            {/* Show "View more" button if there are more than 3 expenses in this category */}
            {categoryExpenses.length > 3 && (
              <Animated.View
                entering={FadeInDown.delay(100 + categoryIndex * 100 + 300).duration(400)}
              >
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12,
                    backgroundColor: themeColors.background,
                    borderRadius: 12,
                    marginBottom: 16
                  }}
                  onPress={() => {}}
                >
                  <Text style={{
                    color: themeColors.primary.default,
                    fontWeight: '600'
                  }}>
                    View {categoryExpenses.length - 3} more expenses
                  </Text>
                  <Icon name="chevron-forward" size={16} color={themeColors.primary.default} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default ExpensesTab;