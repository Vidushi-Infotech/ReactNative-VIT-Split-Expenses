import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import ContactService from '../../services/ContactService';
import { spacing, fontSizes } from '../../theme/theme';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import { Platform } from 'react-native';

const DeviceContactsDebugScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('UNKNOWN');

  const navigation = useNavigation();
  const { colors: themeColors } = useTheme();

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      setLoading(true);
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CONTACTS,
        android: PERMISSIONS.ANDROID.READ_CONTACTS,
      });

      if (!permission) {
        setPermissionStatus('UNAVAILABLE');
        setError('Contacts permission not available for this platform');
        setLoading(false);
        return;
      }

      const status = await check(permission);
      setPermissionStatus(status);

      if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
        loadContacts();
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(`Error checking permission: ${err.message}`);
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      setLoading(true);
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CONTACTS,
        android: PERMISSIONS.ANDROID.READ_CONTACTS,
      });

      if (!permission) {
        Alert.alert('Error', 'Permission not available for this platform');
        setLoading(false);
        return;
      }

      const result = await request(permission);
      setPermissionStatus(result);

      if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
        Alert.alert('Success', 'Permission granted!');
        loadContacts();
      } else {
        Alert.alert('Error', `Permission not granted: ${result}`);
        setLoading(false);
      }
    } catch (err) {
      setError(`Error requesting permission: ${err.message}`);
      Alert.alert('Error', `Failed to request permission: ${err.message}`);
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading device contacts from debug screen...');
      const deviceContacts = await ContactService.getAllContacts();

      if (!deviceContacts || deviceContacts.length === 0) {
        console.log('No contacts returned from ContactService');
        setError('No contacts were returned. Check console logs for details.');
        setContacts([]);
      } else {
        console.log(`Retrieved ${deviceContacts.length} device contacts`);
        setContacts(deviceContacts);
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError(`Error loading contacts: ${err.message}`);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const renderContactItem = ({ item }) => {
    return (
      <View style={[styles.contactItem, { backgroundColor: themeColors.surface }]}>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: themeColors.text }]}>
            {item.name || 'No Name'}
          </Text>

          {item.rawGivenName || item.rawFamilyName ? (
            <Text style={[styles.rawName, { color: themeColors.info }]}>
              Raw: {item.rawGivenName || ''} {item.rawFamilyName || ''}
            </Text>
          ) : null}

          {item.phoneNumbers && item.phoneNumbers.length > 0 ? (
            <View>
              {item.phoneNumbers.map((phone, index) => (
                <Text key={index} style={[styles.phoneNumber, { color: themeColors.textSecondary }]}>
                  {phone.label}: {phone.number}
                </Text>
              ))}
              {item.phoneNumbers.map((phone, index) => (
                <Text key={`clean-${index}`} style={[styles.cleanNumber, { color: themeColors.success.default }]}>
                  Clean: {phone.cleanNumber}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={[styles.noPhone, { color: themeColors.danger }]}>No phone numbers</Text>
          )}

          {item.hasThumbnail && (
            <Text style={[styles.thumbnailInfo, { color: themeColors.success.default }]}>
              Has thumbnail: {item.thumbnail}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderPermissionView = () => {
    // Map permission status to more user-friendly text
    const getStatusText = (status) => {
      switch (status) {
        case RESULTS.UNAVAILABLE:
          return 'This feature is not available on this device';
        case RESULTS.DENIED:
          return 'Permission has not been requested yet';
        case RESULTS.BLOCKED:
          return 'Permission is denied and not requestable anymore';
        case RESULTS.GRANTED:
          return 'Permission is granted';
        case RESULTS.LIMITED:
          return 'Permission is granted but with limitations';
        default:
          return `Unknown status: ${status}`;
      }
    };

    // Determine button text and action based on status
    const getButtonConfig = () => {
      switch (permissionStatus) {
        case RESULTS.DENIED:
          return {
            text: 'Request Permission',
            action: requestPermission,
            color: themeColors.primary.default
          };
        case RESULTS.BLOCKED:
          return {
            text: 'Open Settings',
            action: () => {
              Alert.alert(
                'Permission Required',
                'Please enable contacts permission in your device settings.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open Settings', onPress: () => Linking.openSettings() }
                ]
              );
            },
            color: themeColors.warning
          };
        default:
          return {
            text: 'Try Again',
            action: checkPermission,
            color: themeColors.primary.default
          };
      }
    };

    const buttonConfig = getButtonConfig();

    return (
      <View style={styles.permissionContainer}>
        <Icon name="people-outline" size={60} color={themeColors.textSecondary} />
        <Text style={[styles.permissionTitle, { color: themeColors.text }]}>
          Contacts Permission Required
        </Text>
        <Text style={[styles.permissionText, { color: themeColors.textSecondary }]}>
          We need access to your contacts to display them in this debug screen.
        </Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.permissionStatusLabel, { color: themeColors.textSecondary }]}>
            Current status:
          </Text>
          <Text style={[styles.permissionStatus, { color: themeColors.primary.default }]}>
            {permissionStatus}
          </Text>
          <Text style={[styles.permissionStatusDescription, { color: themeColors.text }]}>
            {getStatusText(permissionStatus)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: buttonConfig.color }]}
          onPress={buttonConfig.action}
        >
          <Text style={styles.permissionButtonText}>{buttonConfig.text}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.alternativeButton, { borderColor: themeColors.border }]}
          onPress={() => {
            // Try to load contacts anyway, even if permission status isn't GRANTED
            loadContacts();
          }}
        >
          <Text style={[styles.alternativeButtonText, { color: themeColors.text }]}>
            Try Loading Contacts Anyway
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Device Contacts Debug
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadContacts}
          disabled={loading || permissionStatus !== RESULTS.GRANTED && permissionStatus !== RESULTS.LIMITED}
        >
          <Icon name="refresh" size={24} color={
            loading || (permissionStatus !== RESULTS.GRANTED && permissionStatus !== RESULTS.LIMITED)
              ? themeColors.textSecondary
              : themeColors.primary.default
          } />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary.default} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Loading contacts...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color={themeColors.danger} />
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>
            Error Loading Contacts
          </Text>
          <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.primary.default }]}
            onPress={loadContacts}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : permissionStatus !== RESULTS.GRANTED && permissionStatus !== RESULTS.LIMITED ? (
        renderPermissionView()
      ) : contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="people-outline" size={60} color={themeColors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            No Contacts Found
          </Text>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            We couldn't find any contacts on your device.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={[styles.contactCount, { color: themeColors.textSecondary }]}>
            Found {contacts.length} contacts
          </Text>
          <FlatList
            data={contacts}
            renderItem={renderContactItem}
            keyExtractor={(item, index) => `contact-${item.contactId || index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  refreshButton: {
    padding: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statusContainer: {
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  permissionStatusLabel: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  permissionStatus: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  permissionStatusDescription: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  permissionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  alternativeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
  },
  alternativeButtonText: {
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSizes.md,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  contactCount: {
    padding: spacing.md,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  listContent: {
    padding: spacing.md,
  },
  contactItem: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  phoneNumber: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  cleanNumber: {
    fontSize: fontSizes.xs,
    marginBottom: spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  rawName: {
    fontSize: fontSizes.xs,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  noPhone: {
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
  },
  thumbnailInfo: {
    fontSize: fontSizes.xs,
    marginTop: spacing.sm,
  },
});

export default DeviceContactsDebugScreen;
