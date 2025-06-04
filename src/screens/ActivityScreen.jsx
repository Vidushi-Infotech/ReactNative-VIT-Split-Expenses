import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const ActivityScreen = ({ navigation }) => {
  // Mock activity data
  const activities = [
    {
      id: 1,
      type: 'expense_added',
      title: 'Raj P. added "Dinner at Italian Restaurant"',
      amount: '₹240',
      time: '2 hours ago',
      group: 'Good Times Gang',
    },
    {
      id: 2,
      type: 'payment_made',
      title: 'You paid Samir J.',
      amount: '₹40',
      time: '1 day ago',
      group: 'Good Times Gang',
    },
    {
      id: 3,
      type: 'expense_added',
      title: 'Kishor C. added "Movie tickets"',
      amount: '₹160',
      time: '2 days ago',
      group: 'Plan Pending',
    },
    {
      id: 4,
      type: 'group_created',
      title: 'You created "Road Tripper"',
      time: '3 days ago',
    },
    {
      id: 5,
      type: 'expense_added',
      title: 'Suhani T. added "Grocery shopping"',
      amount: '₹200',
      time: '1 week ago',
      group: 'Jungle Crew',
    },
  ];

  const getActivityIcon = (type) => {
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

  const getActivityColor = (type) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Recent Activity</Text>
          
          {activities.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
                  <Text style={styles.activityIconText}>{getActivityIcon(activity.type)}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  {activity.group && (
                    <Text style={styles.activityGroup}>in {activity.group}</Text>
                  )}
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                {activity.amount && (
                  <Text style={[styles.activityAmount, { color: getActivityColor(activity.type) }]}>
                    {activity.amount}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
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
    color: '#2D3748',
    marginBottom: 4,
  },
  activityGroup: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ActivityScreen;
