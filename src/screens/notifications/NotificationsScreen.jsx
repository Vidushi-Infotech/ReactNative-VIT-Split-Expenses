import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getColorWithOpacity, shadows } from '../../theme/theme';

// Mock data for notifications
const mockNotifications = [
  {
    id: '1',
    type: 'expense_added',
    title: 'New expense added',
    message: 'John added "Dinner at Restaurant" expense in Trip to Paris',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'payment_reminder',
    title: 'Payment reminder',
    message: 'You need to pay Sarah $25.50 for Groceries',
    time: 'Yesterday',
    read: true,
  },
  {
    id: '3',
    type: 'group_invite',
    title: 'Group invitation',
    message: 'Mike invited you to join "Weekend Getaway"',
    time: '3 days ago',
    read: false,
  },
  {
    id: '4',
    type: 'payment_received',
    title: 'Payment received',
    message: 'Alex paid you $15.75',
    time: 'Last week',
    read: true,
  },
];

const NotificationsScreen = () => {
  const { colors: themeColors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Animation values
  const headerOpacity = useSharedValue(1);
  const markAllButtonScale = useSharedValue(1);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate a refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleMarkAllAsRead = () => {
    // In a real app, we would mark all notifications as read here
    console.log('Mark all as read');
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    // In a real app, we would filter the notifications here
  };

  // Animated styles
  const markAllButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: markAllButtonScale.value }]
    };
  });

  // Filter notifications based on selected type
  const filteredNotifications = filterType === 'all'
    ? mockNotifications
    : mockNotifications.filter(item => item.type === filterType);
  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'expense_added':
        return 'receipt-outline';
      case 'payment_reminder':
        return 'cash-outline';
      case 'group_invite':
        return 'people-outline';
      case 'payment_received':
        return 'checkmark-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderNotificationItem = ({ item, index }) => {
    // Calculate a random delay for staggered animation
    const animationDelay = index * 80;

    return (
      <Animated.View
        entering={FadeInRight.delay(animationDelay).duration(400)}
      >
        <TouchableOpacity
          style={[
            styles.notificationCard,
            { backgroundColor: themeColors.surface },
            !item.read && { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.05) }
          ]}
          activeOpacity={0.7}
          onPressIn={() => {
            markAllButtonScale.value = withSpring(0.95);
          }}
          onPressOut={() => {
            markAllButtonScale.value = withSpring(1);
          }}
        >
          {!item.read && (
            <View style={[styles.unreadIndicator, { backgroundColor: getNotificationColor(item.type) }]} />
          )}

          <View style={[
            styles.iconContainer,
            {
              backgroundColor: getNotificationColor(item.type, 0.1),
            }
          ]}>
            <Icon
              name={getNotificationIcon(item.type)}
              size={20}
              color={getNotificationColor(item.type)}
            />
          </View>

          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={[styles.notificationTitle, { color: themeColors.text }]}>{item.title}</Text>
              <Text style={[styles.notificationTime, { color: themeColors.textSecondary }]}>{item.time}</Text>
            </View>
            <Text style={[styles.notificationMessage, { color: themeColors.textSecondary }]}>{item.message}</Text>
          </View>

          <TouchableOpacity style={styles.moreButton}>
            <Icon name="ellipsis-vertical" size={16} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Get color for notification type
  const getNotificationColor = (type, opacity) => {
    let color;
    switch (type) {
      case 'expense_added':
        color = themeColors.info;
        break;
      case 'payment_reminder':
        color = themeColors.warning;
        break;
      case 'group_invite':
        color = themeColors.primary.default;
        break;
      case 'payment_received':
        color = themeColors.success;
        break;
      default:
        color = themeColors.primary.default;
    }

    return opacity ? getColorWithOpacity(color, opacity) : color;
  };

  // This function is now imported from theme.js

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <View style={styles.headerTitleContainer}>
            <Animated.Text
              entering={FadeInDown.duration(800)}
              style={[styles.title, { color: themeColors.text }]}
            >
              Notifications
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(200).duration(800)}
              style={[styles.subtitle, { color: themeColors.textSecondary }]}
            >
              Stay updated with your expenses
            </Animated.Text>
          </View>

          <Animated.View style={markAllButtonAnimatedStyle}>
            <TouchableOpacity
              style={[styles.markAllButton, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.1) }]}
              onPress={handleMarkAllAsRead}
              onPressIn={() => {
                markAllButtonScale.value = withSpring(0.9);
              }}
              onPressOut={() => {
                markAllButtonScale.value = withSpring(1);
              }}
            >
              <Icon name="checkmark-done-outline" size={14} color={themeColors.primary.default} style={{ marginRight: 4 }} />
              <Text style={[styles.markAllText, { color: themeColors.primary.default }]}>Mark all read</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(800)}
          style={styles.filterContainer}
        >
          <ScrollableFilter
            options={[
              { id: 'all', label: 'All', icon: 'notifications-outline' },
              { id: 'expense_added', label: 'Expenses', icon: 'receipt-outline' },
              { id: 'payment_reminder', label: 'Reminders', icon: 'cash-outline' },
              { id: 'group_invite', label: 'Invites', icon: 'people-outline' },
              { id: 'payment_received', label: 'Payments', icon: 'checkmark-circle-outline' },
            ]}
            selectedId={filterType}
            onSelect={handleFilterChange}
            themeColors={themeColors}
          />
        </Animated.View>

        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={() => (
            <Animated.View
              entering={FadeInDown.duration(800)}
              style={styles.emptyContainer}
            >
              <Icon name="notifications-off-outline" size={60} color={getColorWithOpacity(themeColors.primary.default, 0.5)} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Notifications</Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
                {filterType === 'all'
                  ? 'You don\'t have any notifications yet'
                  : `You don\'t have any ${filterType.replace('_', ' ')} notifications`}
              </Text>
            </Animated.View>
          )}
        />
      </View>
    </SafeAreaWrapper>
  );
};

// Scrollable filter component
const ScrollableFilter = ({ options, selectedId, onSelect, themeColors }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScrollContent}
    >
      {options.map(option => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.filterOption,
            { backgroundColor: option.id === selectedId
              ? getColorWithOpacity(themeColors.primary.default, 0.1)
              : getColorWithOpacity(themeColors.textSecondary, 0.05)
            }
          ]}
          onPress={() => onSelect(option.id)}
        >
          <Icon
            name={option.icon}
            size={14}
            color={option.id === selectedId ? themeColors.primary.default : themeColors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterOptionText,
              { color: option.id === selectedId ? themeColors.primary.default : themeColors.textSecondary }
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  markAllText: {
    fontWeight: '600',
    fontSize: 12,
  },
  filterContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    letterSpacing: 0.3,
  },
  notificationTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  moreButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
});

export default NotificationsScreen;
