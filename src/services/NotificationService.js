import { Platform, PermissionsAndroid } from 'react-native';
import { collection, addDoc, query, where, getDocs, orderBy, limit, updateDoc, doc, Timestamp, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getApp } from '@react-native-firebase/app';

// Conditionally import Firebase modules
let messaging;
let notifee;
let AndroidImportance;
let EventType;

try {
  // Only import if platform is mobile
  if (Platform.OS !== 'web') {
    messaging = require('@react-native-firebase/messaging').default;
    const notifeeModule = require('@notifee/react-native');
    notifee = notifeeModule.default;
    AndroidImportance = notifeeModule.AndroidImportance;
    EventType = notifeeModule.EventType;
  }
} catch (error) {
  console.warn('Error importing notification modules:', error);
}

// Check if Firebase is initialized
let isFirebaseInitialized = false;

// Function to check if Firebase is initialized
const checkFirebaseInitialization = () => {
  try {
    // Try to get the default app
    getApp();
    isFirebaseInitialized = true;
    return true;
  } catch (error) {
    console.warn('Firebase not initialized yet:', error.message);
    isFirebaseInitialized = false;
    return false;
  }
};

// Initial check
checkFirebaseInitialization();

/**
 * Service for handling notifications with Firebase
 */
class NotificationService {
  /**
   * Request permission for push notifications
   * @returns {Promise<boolean>} - Whether permission was granted
   */
  static async requestPermission() {
    try {
      // Handle Android permissions
      if (Platform.OS === 'android') {
        // For Android 13+ (API 33+), we need to request POST_NOTIFICATIONS permission
        if (Platform.Version >= 33) {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
              {
                title: "Notification Permission",
                message: "VitSplit needs to send you notifications about expenses and payments.",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK"
              }
            );

            const permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
            console.log('Android 13+ notification permission:', permissionGranted ? 'granted' : 'denied');

            // Even if system permission is denied, try FCM permission
            if (checkFirebaseInitialization() && messaging) {
              try {
                const messagingInstance = messaging(getApp());
                await messagingInstance.requestPermission();
              } catch (fcmError) {
                console.warn('Error requesting FCM permission on Android 13+:', fcmError);
              }
            }

            return permissionGranted;
          } catch (error) {
            console.warn('Error requesting Android 13+ notification permission:', error);
            // Fall through to FCM permission as fallback
          }
        }

        // For older Android versions or if the above fails, just use FCM permission
        if (checkFirebaseInitialization() && messaging) {
          try {
            const messagingInstance = messaging(getApp());
            const authStatus = await messagingInstance.requestPermission();
            const fcmEnabled =
              authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
              authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            console.log('FCM permission status (Android):', fcmEnabled ? 'granted' : 'denied');
            return fcmEnabled;
          } catch (fcmError) {
            console.warn('Error requesting FCM permission on Android:', fcmError);
            // For older Android versions, assume permission is granted if FCM fails
            return Platform.Version < 33;
          }
        }

        // If Firebase is not initialized on older Android, assume permission is granted
        return Platform.Version < 33;
      }

      // Handle iOS permissions
      else if (Platform.OS === 'ios') {
        // On iOS, we use Firebase Messaging for permission
        if (checkFirebaseInitialization() && messaging) {
          try {
            const messagingInstance = messaging(getApp());
            const authStatus = await messagingInstance.requestPermission();
            const enabled =
              authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
              authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            console.log('iOS notification permission:', enabled ? 'granted' : 'denied');
            return enabled;
          } catch (error) {
            console.warn('Error requesting iOS notification permission:', error);
            return false;
          }
        }
      }

      // Default fallback
      console.log('Notification permission not available on this platform');
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token for the device
   * @returns {Promise<string|null>} - FCM token
   */
  static async getFCMToken() {
    try {
      // Check if Firebase is initialized
      if (!checkFirebaseInitialization()) {
        console.log('Cannot get FCM token: Firebase not initialized');
        return null;
      }

      // Get the messaging instance using getApp()
      const messagingInstance = messaging(getApp());
      const token = await messagingInstance.getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to Firestore for a user
   * @param {string} userId - User ID
   * @param {string} token - FCM token
   * @returns {Promise<boolean>} - Success status
   */
  static async saveFCMToken(userId, token) {
    try {
      if (!userId || !token) return false;

      // Check if token already exists
      const tokensRef = collection(db, 'UserTokens');
      const q = query(tokensRef, where('userId', '==', userId), where('token', '==', token));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Add new token
        await addDoc(collection(db, 'UserTokens'), {
          userId,
          token,
          platform: Platform.OS,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return true;
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
  }

  /**
   * Display a local notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   * @returns {Promise<string>} - Notification ID
   */
  static async displayLocalNotification(title, body, data = {}) {
    try {
      // Check if notifee is available
      if (!notifee) {
        console.log('Cannot display notification: notifee not available');
        return null;
      }

      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      // Display the notification
      const notificationId = await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error displaying local notification:', error);
      return null;
    }
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of notifications to fetch
   * @returns {Promise<Array>} - Array of notifications
   */
  static async getNotifications(userId, limitCount = 50) {
    try {
      if (!userId) return [];

      const notificationsRef = collection(db, 'Notifications');
      let notifications = [];

      try {
        // Try with the complex query first (requires index)
        const q = query(
          notificationsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          });
        });
      } catch (indexError) {
        // If index error occurs, fall back to a simpler query
        console.warn('Index error, falling back to simpler query:', indexError.message);

        // Simpler query without orderBy (doesn't require index)
        const fallbackQuery = query(
          notificationsRef,
          where('userId', '==', userId)
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);

        // Process results and sort manually
        const tempNotifications = [];
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data();
          tempNotifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          });
        });

        // Sort manually by createdAt in descending order
        notifications = tempNotifications.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }).slice(0, limitCount);

        // Log the index creation URL for the developer
        if (indexError.message && indexError.message.includes('https://console.firebase.google.com')) {
          const indexUrl = indexError.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
          if (indexUrl) {
            console.warn('Create the required index here:', indexUrl);
          }
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} - Success status
   */
  static async markAsRead(notificationId) {
    try {
      if (!notificationId) return false;

      const notificationRef = doc(db, 'Notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  static async markAllAsRead(userId) {
    try {
      if (!userId) return false;

      // Try with the compound query first (may require index)
      try {
        const notificationsRef = collection(db, 'Notifications');
        const q = query(
          notificationsRef,
          where('userId', '==', userId),
          where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // No unread notifications
          return true;
        }

        // Create a batch
        const batch = writeBatch(db);

        // Add update operations to the batch
        querySnapshot.forEach((document) => {
          batch.update(doc(db, 'Notifications', document.id), {
            read: true,
            updatedAt: serverTimestamp(),
          });
        });

        // Commit the batch
        await batch.commit();
        return true;
      } catch (indexError) {
        // If index error occurs, fall back to updating one by one
        console.warn('Index error in markAllAsRead, falling back to individual updates:', indexError.message);

        // Simpler query without the read filter
        const notificationsRef = collection(db, 'Notifications');
        const fallbackQuery = query(
          notificationsRef,
          where('userId', '==', userId)
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);

        // Update unread notifications one by one
        const updatePromises = [];
        fallbackSnapshot.forEach((document) => {
          const data = document.data();
          if (data.read === false) {
            updatePromises.push(
              updateDoc(doc(db, 'Notifications', document.id), {
                read: true,
                updatedAt: serverTimestamp(),
              })
            );
          }
        });

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }

        return true;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Create a notification in Firestore
   * @param {Object} notification - Notification data
   * @returns {Promise<string>} - Notification ID
   */
  static async createNotification(notification) {
    try {
      if (!notification || !notification.userId) return null;

      const notificationData = {
        ...notification,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'Notifications'), notificationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Unread notification count
   */
  static async getUnreadCount(userId) {
    try {
      if (!userId) return 0;

      const notificationsRef = collection(db, 'Notifications');

      try {
        // Try with the compound query first (may require index)
        const q = query(
          notificationsRef,
          where('userId', '==', userId),
          where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
      } catch (indexError) {
        // If index error occurs, fall back to a simpler query and filter manually
        console.warn('Index error in getUnreadCount, falling back to manual filtering:', indexError.message);

        // Simpler query without the read filter
        const fallbackQuery = query(
          notificationsRef,
          where('userId', '==', userId)
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);

        // Count unread notifications manually
        let unreadCount = 0;
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.read === false) {
            unreadCount++;
          }
        });

        return unreadCount;
      }
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  /**
   * Create a group invitation notification
   * @param {string} userId - User ID to send notification to
   * @param {string} groupName - Name of the group
   * @param {string} inviterName - Name of the person who invited
   * @param {string} groupId - ID of the group
   * @returns {Promise<string>} - Notification ID
   */
  static async createGroupInviteNotification(userId, groupName, inviterName, groupId) {
    try {
      if (!userId || !groupName || !inviterName || !groupId) {
        console.error('Missing required parameters for group invite notification');
        return null;
      }

      const notificationData = {
        userId,
        type: 'group_invite',
        title: 'New Group Invitation',
        message: `${inviterName} added you to the group "${groupName}"`,
        groupId,
        read: false,
      };

      const notificationId = await this.createNotification(notificationData);

      // Also send a push notification if possible
      if (notificationId) {
        await this.displayLocalNotification(
          notificationData.title,
          notificationData.message,
          { type: notificationData.type, groupId }
        );
      }

      return notificationId;
    } catch (error) {
      console.error('Error creating group invite notification:', error);
      return null;
    }
  }

  /**
   * Create an expense added notification
   * @param {string} userId - User ID to send notification to
   * @param {string} groupName - Name of the group
   * @param {string} adderName - Name of the person who added the expense
   * @param {number} amount - Amount of the expense
   * @param {string} expenseTitle - Title of the expense
   * @param {string} groupId - ID of the group
   * @param {string} expenseId - ID of the expense
   * @returns {Promise<string>} - Notification ID
   */
  static async createExpenseAddedNotification(userId, groupName, adderName, amount, expenseTitle, groupId, expenseId) {
    try {
      if (!userId || !groupName || !adderName || !amount || !groupId || !expenseId) {
        console.error('Missing required parameters for expense added notification');
        return null;
      }

      const formattedAmount = `₹${amount.toFixed(2)}`;

      const notificationData = {
        userId,
        type: 'expense_added',
        title: `New Expense in ${groupName}`,
        message: `${adderName} added ${formattedAmount} for "${expenseTitle || 'an expense'}"`,
        groupId,
        expenseId,
        read: false,
      };

      const notificationId = await this.createNotification(notificationData);

      // Also send a push notification if possible
      if (notificationId) {
        await this.displayLocalNotification(
          notificationData.title,
          notificationData.message,
          { type: notificationData.type, groupId, expenseId }
        );
      }

      return notificationId;
    } catch (error) {
      console.error('Error creating expense added notification:', error);
      return null;
    }
  }

  /**
   * Create a payment received notification
   * @param {string} userId - User ID to send notification to (who made the payment)
   * @param {string} receiverId - User ID who received the payment
   * @param {string} receiverName - Name of the person who received the payment
   * @param {number} amount - Amount of the payment
   * @param {string} groupId - ID of the group
   * @param {string} paymentId - ID of the payment
   * @returns {Promise<string>} - Notification ID
   */
  static async createPaymentReceivedNotification(userId, receiverId, receiverName, amount, groupId, paymentId) {
    try {
      if (!userId || !receiverId || !groupId) {
        console.error('Missing required parameters for payment received notification');
        return null;
      }

      // Ensure amount is a number and has toFixed method
      const numericAmount = parseFloat(amount);
      const formattedAmount = !isNaN(numericAmount) ? `₹${numericAmount.toFixed(2)}` : '₹0.00';

      const notificationData = {
        userId, // This is the user who will receive the notification (who made the payment)
        type: 'payment_received',
        title: 'Payment Received',
        message: `${receiverName || 'Someone'} marked your payment of ${formattedAmount} as received`,
        groupId,
        paymentId,
        read: false,
      };

      const notificationId = await this.createNotification(notificationData);

      // Also send a push notification if possible
      if (notificationId) {
        await this.displayLocalNotification(
          notificationData.title,
          notificationData.message,
          { type: notificationData.type, groupId, paymentId }
        );
      }

      return notificationId;
    } catch (error) {
      console.error('Error creating payment received notification:', error);
      return null;
    }
  }

  /**
   * Helper method to show how to create the required Firestore indexes
   * This method doesn't actually create the indexes, but provides instructions
   */
  static showIndexCreationInstructions() {
    console.info('=== Firestore Index Creation Instructions ===');
    console.info('1. Go to the Firebase Console: https://console.firebase.google.com');
    console.info('2. Select your project');
    console.info('3. Go to Firestore Database > Indexes');
    console.info('4. Click "Add Index"');
    console.info('5. Create the following indexes:');
    console.info('   a. Collection: Notifications');
    console.info('      Fields: userId (Ascending), createdAt (Descending)');
    console.info('   b. Collection: Notifications');
    console.info('      Fields: userId (Ascending), read (Ascending)');
    console.info('6. Click "Create Index"');
    console.info('7. Wait for the indexes to be created (may take a few minutes)');
    console.info('=== End of Instructions ===');

    // You can also open the index creation URL directly
    const indexUrl = 'https://console.firebase.google.com/project/_/firestore/indexes';
    console.info('Or visit:', indexUrl.replace('_', 'your-project-id'));
  }
}

export default NotificationService;
