import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { useAuth } from './AuthContext';
import NotificationService from '../services/NotificationService';
import { useNavigation } from '@react-navigation/native';

// Conditionally import Firebase modules
let messaging;
let notifee;
let EventType;
let getFirebaseApp;

try {
  // Only import if platform is mobile
  if (Platform.OS !== 'web') {
    const firebaseApp = require('@react-native-firebase/app');
    getFirebaseApp = firebaseApp.getApp;
    messaging = require('@react-native-firebase/messaging').default;
    notifee = require('@notifee/react-native').default;
    EventType = require('@notifee/react-native').EventType;
  }
} catch (error) {
  console.warn('Error importing notification modules:', error);
}

// Function to check if Firebase is initialized
const isFirebaseInitialized = () => {
  try {
    if (getFirebaseApp) {
      getFirebaseApp();
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Firebase not initialized:', error.message);
    return false;
  }
};

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Try to get navigation, but handle the case when it's not available
  let navigation;
  try {
    navigation = useNavigation();
  } catch (error) {
    console.warn('Navigation not available in NotificationProvider:', error.message);
    navigation = {
      navigate: (screen, params) => {
        console.warn(`Navigation attempted to ${screen} with params:`, params);
        console.warn('Navigation is not available in this context');
      }
    };
  }

  const appState = React.useRef(AppState.currentState);

  // Initialize notifications
  useEffect(() => {
    if (userProfile) {
      // Setup notifications and request permissions
      setupNotifications();
      fetchNotifications();
    }
  }, [userProfile]);

  // Request notification permissions when the app starts
  useEffect(() => {
    const requestNotificationPermissions = async () => {
      try {
        // Use our NotificationService to request permissions
        // This handles all the platform-specific logic
        const granted = await NotificationService.requestPermission();

        if (granted) {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };

    // Only request permissions if we have a user
    if (userProfile) {
      requestNotificationPermissions();
    }
  }, [userProfile]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        userProfile
      ) {
        // App has come to the foreground, refresh notifications
        fetchNotifications();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [userProfile]);

  // Setup notification handlers
  const setupNotifications = async () => {
    try {
      // Check if we're on a platform that supports notifications
      if (Platform.OS === 'web' || !messaging || !notifee) {
        console.log('Notifications not supported on this platform');
        return;
      }

      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        console.log('Firebase not initialized, skipping notification setup');
        return;
      }

      // Request permission
      const hasPermission = await NotificationService.requestPermission();

      if (!hasPermission) {
        console.log('Notification permission not granted');
        return;
      }

      // Get FCM token
      const token = await NotificationService.getFCMToken();

      if (token && userProfile) {
        // Save token to Firestore
        await NotificationService.saveFCMToken(userProfile.id, token);
      }

      // Set up foreground message handler
      let unsubscribeForeground = () => {};
      try {
        // Get the messaging instance using getApp()
        const messagingInstance = messaging(getFirebaseApp());
        unsubscribeForeground = messagingInstance.onMessage(async remoteMessage => {
          console.log('Foreground notification received:', remoteMessage);

          // Display local notification
          await NotificationService.displayLocalNotification(
            remoteMessage.notification.title,
            remoteMessage.notification.body,
            remoteMessage.data
          );

          // Refresh notifications
          fetchNotifications();
        });
      } catch (error) {
        console.warn('Error setting up foreground message handler:', error);
      }

      // Set up background/quit state message handler
      try {
        // Get the messaging instance using getApp()
        const messagingInstance = messaging(getFirebaseApp());
        messagingInstance.setBackgroundMessageHandler(async remoteMessage => {
          console.log('Background notification received:', remoteMessage);
          return null;
        });
      } catch (error) {
        console.warn('Error setting up background message handler:', error);
      }

      // Set up notification tap handler
      let unsubscribeNotifee = () => {};
      try {
        unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
          if (type === EventType.PRESS) {
            console.log('User pressed notification', detail.notification);
            handleNotificationPress(detail.notification);
          }
        });
      } catch (error) {
        console.warn('Error setting up notification tap handler:', error);
      }

      return () => {
        try {
          unsubscribeForeground();
          unsubscribeNotifee();
        } catch (error) {
          console.warn('Error cleaning up notification handlers:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  // Handle notification press
  const handleNotificationPress = (notification) => {
    try {
      if (!notification || !notification.data) return;

      const { type, groupId, expenseId, paymentId } = notification.data;

      switch (type) {
        case 'expense_added':
          if (groupId) {
            navigation.navigate('GroupDetails', { groupId });
          }
          break;
        case 'payment_reminder':
        case 'payment_received':
          if (groupId) {
            navigation.navigate('GroupDetails', {
              groupId,
              initialTab: 'payments'
            });
          }
          break;
        case 'group_invite':
          if (groupId) {
            navigation.navigate('GroupDetails', { groupId });
          }
          break;
        default:
          navigation.navigate('Notifications');
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  // Fetch notifications from Firestore
  const fetchNotifications = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);

      // Get notifications
      const notificationsData = await NotificationService.getNotifications(userProfile.id);
      setNotifications(notificationsData);

      // Get unread count
      const count = await NotificationService.getUnreadCount(userProfile.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      const success = await NotificationService.markAsRead(notificationId);

      if (success) {
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );

        // Update unread count
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }

      return success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userProfile) return false;

    try {
      const success = await NotificationService.markAllAsRead(userProfile.id);

      if (success) {
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, read: true }))
        );

        // Update unread count
        setUnreadCount(0);
      }

      return success;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };

  // Refresh notifications
  const refreshNotifications = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Create a test notification (for development)
  const createTestNotification = async () => {
    if (!userProfile) return;

    try {
      // Create a random notification type for testing
      const notificationTypes = ['group_invite', 'expense_added', 'payment_received'];
      const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];

      let notificationId;

      switch (randomType) {
        case 'group_invite':
          notificationId = await NotificationService.createGroupInviteNotification(
            userProfile.id,
            'Test Group',
            'Test User',
            'test-group-id'
          );
          break;

        case 'expense_added':
          notificationId = await NotificationService.createExpenseAddedNotification(
            userProfile.id,
            'Test Group',
            'Test User',
            1250.50,
            'Dinner',
            'test-group-id',
            'test-expense-id'
          );
          break;

        case 'payment_received':
          notificationId = await NotificationService.createPaymentReceivedNotification(
            userProfile.id,
            'Test User',
            500.00,
            'Test Group',
            'test-group-id',
            'test-payment-id'
          );
          break;

        default:
          // Fallback to basic notification
          const notificationData = {
            userId: userProfile.id,
            type: 'expense_added',
            title: 'Test Notification',
            message: 'This is a test notification',
            time: new Date().toISOString(),
          };
          notificationId = await NotificationService.createNotification(notificationData);
      }

      if (notificationId) {
        // Refresh notifications
        fetchNotifications();
        Alert.alert('Success', `Test ${randomType.replace('_', ' ')} notification created`);
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      Alert.alert('Error', 'Failed to create test notification');
    }
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    loading,
    refreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    createTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
