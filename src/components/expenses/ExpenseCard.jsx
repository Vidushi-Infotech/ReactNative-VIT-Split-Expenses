import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getUserById } from '../../utils/mockData.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import Avatar from '../common/Avatar.jsx';
import Card from '../common/Card.jsx';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, fontSizes, borderRadius } from '../../theme/theme.js';

const ExpenseCard = ({ expense }) => {
  const { isDarkMode } = useTheme();
  const paidByUser = getUserById(expense.paidBy);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get category icon
  const getCategoryIcon = () => {
    switch (expense.category) {
      case 'Food':
        return 'restaurant-outline';
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
      default:
        return 'cash-outline';
    }
  };

  return (
    <Card variant="default" style={styles.card}>
      <View style={styles.container}>
        <View
          style={[styles.iconContainer, { backgroundColor: isDarkMode ? colors.dark.light : colors.light.dark }]}
        >
          <Icon name={getCategoryIcon()} size={20} color={colors.primary.default} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={styles.descriptionContainer}>
              <Text
                style={[styles.description, { color: isDarkMode ? colors.white : colors.dark.default }]}
                numberOfLines={1}
              >
                {expense.description}
              </Text>

              <View style={styles.metaContainer}>
                <Text style={[styles.date, { color: isDarkMode ? colors.gray[400] : colors.gray[500] }]}>
                  {formatDate(expense.date)}
                </Text>

                {expense.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {expense.category}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={[styles.amount, { color: isDarkMode ? colors.white : colors.dark.default }]}>
              ${expense.amount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.paidByContainer}>
              <Avatar source={paidByUser.avatar} name={paidByUser.name} size="sm" />
              <Text style={[styles.paidByText, { color: isDarkMode ? colors.gray[300] : colors.gray[600] }]}>
                Paid by {paidByUser.name.split(' ')[0]}
              </Text>
            </View>

            <Text style={[styles.participantsText, { color: isDarkMode ? colors.gray[400] : colors.gray[500] }]}>
              {expense.participants.length} participants
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  container: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  descriptionContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  description: {
    fontWeight: '500',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  date: {
    fontSize: fontSizes.xs,
    marginRight: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.primary.default + '33', // 20% opacity
    borderRadius: 9999, // rounded-full
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: fontSizes.xs,
    color: colors.primary.default,
  },
  amount: {
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  paidByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidByText: {
    marginLeft: spacing.sm,
    fontSize: fontSizes.sm,
  },
  participantsText: {
    fontSize: fontSizes.xs,
  },
});

export default ExpenseCard;
