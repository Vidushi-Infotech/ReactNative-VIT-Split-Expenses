import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
// Removed unused animation imports
import { getColorWithOpacity } from '../../theme/theme';

// Notification types and their details
const NOTIFICATION_TYPES = {
  expense_added: {
    icon: 'receipt-outline',
    color: 'info',
    label: 'Expenses',
  },
  payment_reminder: {
    icon: 'cash-outline',
    color: 'warning',
    label: 'Reminders',
  },
  group_invite: {
    icon: 'people-outline',
    color: 'primary',
    label: 'Invites',
  },
  payment_received: {
    icon: 'checkmark-circle-outline',
    color: 'success',
    label: 'Payments',
  },
};

const NotificationsScreen = () => {
  const { colors: themeColors } = useTheme();
  const { userProfile } = useAuth();
  const {
    notifications,
    loading,
    refreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    createTestNotification
  } = useNotification();
  const [filterType, setFilterType] = useState('all');

  // Load notifications when the screen mounts
  useEffect(() => {
    if (userProfile) {
      fetchNotifications();
    }
  }, [userProfile]);

  const handleRefresh = () => {
    refreshNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleNotificationPress = (notification) => {
    // Mark the notification as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
  };

  // Filter notifications based on selected type
  const filteredNotifications = filterType === 'all'
    ? notifications
    : notifications.filter(item => item.type === filterType);

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
  };
  // Get icon for notification type
  const getNotificationIcon = (type) => {
    return NOTIFICATION_TYPES[type]?.icon || 'notifications-outline';
  };

  const renderNotificationItem = ({ item, onPress }) => {
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { backgroundColor: themeColors.surface },
          !item.read && { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.05) }
        ]}
        activeOpacity={0.7}
        onPress={() => onPress && onPress(item)}
      >
        {!item.read && (
          <View style={[styles.unreadIndicator, { backgroundColor: getNotificationColor(item.type) }]} />
        )}

        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type, 0.1) }
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
            <Text style={[styles.notificationTime, { color: themeColors.textSecondary }]}>
              {formatRelativeTime(item.createdAt || item.time)}
            </Text>
          </View>
          <Text style={[styles.notificationMessage, { color: themeColors.textSecondary }]}>{item.message}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Get color for notification type
  const getNotificationColor = (type, opacity) => {
    const colorType = NOTIFICATION_TYPES[type]?.color || 'primary';
    let color;

    switch (colorType) {
      case 'info':
        color = themeColors.info;
        break;
      case 'warning':
        color = themeColors.warning;
        break;
      case 'primary':
        color = themeColors.primary.default;
        break;
      case 'success':
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
        <View style={[styles.header]}>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Notifications
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Stay updated with your expenses
            </Text>
          </View>

          <View style={styles.headerButtons}>
            {/* Dev buttons - only in development */}
            {__DEV__ && (
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: getColorWithOpacity(themeColors.success, 0.1), marginRight: 8 }]}
                onPress={createTestNotification}
              >
                <Icon name="add-outline" size={14} color={themeColors.success} style={{ marginRight: 4 }} />
                <Text style={[styles.headerButtonText, { color: themeColors.success }]}>Test</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.markAllButton, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.1) }]}
              onPress={handleMarkAllAsRead}
            >
              <Icon name="checkmark-done-outline" size={14} color={themeColors.primary.default} style={{ marginRight: 4 }} />
              <Text style={[styles.markAllText, { color: themeColors.primary.default }]}>Mark all read</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterContainer}>
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
        </View>

        {loading && filteredNotifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary.default} />
            <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
              Loading notifications...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            renderItem={({ item }) => renderNotificationItem({ item, onPress: handleNotificationPress })}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Icon name="notifications-off-outline" size={60} color={getColorWithOpacity(themeColors.primary.default, 0.5)} />
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Notifications</Text>
                <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
                  {filterType === 'all'
                    ? 'You don\'t have any notifications yet'
                    : `You don\'t have any ${filterType.replace('_', ' ')} notifications`}
                </Text>
              </View>
            )}
        />
        )}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  headerButtonText: {
    fontWeight: '600',
    fontSize: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default NotificationsScreen;
