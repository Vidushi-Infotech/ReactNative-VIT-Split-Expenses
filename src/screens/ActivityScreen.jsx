import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import ActivitySkeleton from '../components/ActivitySkeleton';
import firebaseService from '../services/firebaseService';

const ActivityScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecentActivities();
    } else {
      setInitialLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecentActivities = async () => {
    setLoading(true);
    try {
      console.log('📱 Loading recent activities for user:', user?.uid);

      // Get user's groups
      const userGroups = await firebaseService.getUserGroups(user.uid);
      console.log('📱 Found', userGroups.length, 'groups for activity loading');

      const allActivities = [];

      // Add group creation activities
      userGroups.forEach(group => {
        if (group.createdBy === user.uid) {
          allActivities.push({
            id: `group_${group.id}`,
            type: 'group_created',
            title: `You created "${group.name}"`,
            time: formatTimeAgo(group.createdAt?.toDate() || new Date()),
            group: null,
            timestamp: group.createdAt?.toDate() || new Date(),
            amount: null,
          });
        }
      });

      // Get expenses from all groups
      for (const group of userGroups) {
        try {
          const groupExpenses = await firebaseService.getGroupExpenses(
            group.id,
          );
          const groupMembers =
            await firebaseService.getGroupMembersWithProfiles(group.id);

          groupExpenses.forEach(expense => {
            const paidByMember = groupMembers.find(
              m => m.userId === expense.paidBy,
            );
            const isYouPaid = expense.paidBy === user.uid;

            allActivities.push({
              id: `expense_${expense.id}`,
              type: 'expense_added',
              title: `${
                isYouPaid ? 'You' : paidByMember?.name || 'Someone'
              } added "${expense.description}"`,
              amount: `₹${expense.amount.toFixed(0)}`,
              time: formatTimeAgo(expense.createdAt?.toDate() || new Date()),
              group: group.name,
              timestamp: expense.createdAt?.toDate() || new Date(),
              groupId: group.id,
            });
          });
        } catch (groupError) {
          console.error(
            '📱 Error loading expenses for group:',
            group.id,
            groupError,
          );
        }
      }

      // Get settlements from all groups
      for (const group of userGroups) {
        try {
          const groupSettlements = await firebaseService.getGroupSettlements(
            group.id,
          );
          const groupMembers =
            await firebaseService.getGroupMembersWithProfiles(group.id);

          groupSettlements.forEach(settlement => {
            const fromMember = groupMembers.find(
              m => m.userId === settlement.fromUserId,
            );
            const toMember = groupMembers.find(
              m => m.userId === settlement.toUserId,
            );
            const isYouPaid = settlement.fromUserId === user.uid;
            const isYouReceived = settlement.toUserId === user.uid;

            let title;
            if (isYouPaid) {
              title = `You paid ${toMember?.name || 'Someone'}`;
            } else if (isYouReceived) {
              title = `${fromMember?.name || 'Someone'} paid you`;
            } else {
              title = `${fromMember?.name || 'Someone'} paid ${
                toMember?.name || 'Someone'
              }`;
            }

            allActivities.push({
              id: `settlement_${settlement.id}`,
              type: 'payment_made',
              title,
              amount: `₹${settlement.amount.toFixed(0)}`,
              time: formatTimeAgo(settlement.settledAt?.toDate() || new Date()),
              group: group.name,
              timestamp: settlement.settledAt?.toDate() || new Date(),
              groupId: group.id,
            });
          });
        } catch (settlementError) {
          console.log(
            '📱 No settlements or permission issue for group:',
            group.id,
          );
        }
      }

      // Sort activities by timestamp (newest first)
      const sortedActivities = allActivities.sort(
        (a, b) => b.timestamp - a.timestamp,
      );

      console.log('📱 Loaded', sortedActivities.length, 'total activities');
      setActivities(sortedActivities.slice(0, 50)); // Limit to last 50 activities
    } catch (error) {
      console.error('📱 Error loading recent activities:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const formatTimeAgo = date => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRecentActivities();
    } catch (error) {
      console.error('📱 Error refreshing activities:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getActivityIcon = type => {
    switch (type) {
      case 'expense_added':
        return '💰';
      case 'payment_made':
        return '💸';
      case 'group_created':
        return '👥';
      default:
        return '📝';
    }
  };

  const getActivityColor = type => {
    switch (type) {
      case 'expense_added':
        return '#F59E0B';
      case 'payment_made':
        return '#10B981';
      case 'group_created':
        return '#6366F1';
      default:
        return '#6B7280';
    }
  };

  const styles = createStyles(theme);

  // Show skeleton during initial loading
  if (initialLoading) {
    return <ActivitySkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Activity</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }>
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
          ) : activities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No recent activity</Text>
              <Text style={styles.emptySubtext}>
                Your group activities will appear here
              </Text>
            </View>
          ) : (
            activities.map(activity => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                onPress={() => {
                  if (activity.groupId) {
                    // Navigate to group detail if activity has groupId
                    const group = {id: activity.groupId, name: activity.group};
                    navigation.navigate('GroupDetail', {group});
                  }
                }}>
                <View style={styles.activityHeader}>
                  <View
                    style={[
                      styles.activityIcon,
                      {backgroundColor: getActivityColor(activity.type) + '20'},
                    ]}>
                    <Text style={styles.activityIconText}>
                      {getActivityIcon(activity.type)}
                    </Text>
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    {activity.group && (
                      <Text style={styles.activityGroup}>
                        in {activity.group}
                      </Text>
                    )}
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  {activity.amount && (
                    <Text
                      style={[
                        styles.activityAmount,
                        {color: getActivityColor(activity.type)},
                      ]}>
                      {activity.amount}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
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
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    activityCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: theme.colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    activityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activityIconText: {
      fontSize: 18,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    activityGroup: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    activityTime: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    activityAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  });

export default ActivityScreen;
