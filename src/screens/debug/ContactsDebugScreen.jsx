import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  NativeModules
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { checkContactsModuleStatus, getPlatformDetails } from '../../utils/contactsHelper';
import ContactService from '../../services/ContactService';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';

const ContactsDebugScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [moduleStatus, setModuleStatus] = useState(null);
  const [platformDetails, setPlatformDetails] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [contactsCount, setContactsCount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkModuleStatus();
  }, []);

  const checkModuleStatus = () => {
    try {
      const status = checkContactsModuleStatus();
      setModuleStatus(status);
      
      const details = getPlatformDetails();
      setPlatformDetails(details);
    } catch (err) {
      setError(`Error checking module status: ${err.message}`);
    }
  };

  const checkPermission = async () => {
    try {
      setLoading(true);
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CONTACTS,
        android: PERMISSIONS.ANDROID.READ_CONTACTS,
      });
      
      if (!permission) {
        setPermissionStatus('UNAVAILABLE');
        return;
      }
      
      const status = await check(permission);
      setPermissionStatus(status);
    } catch (err) {
      setError(`Error checking permission: ${err.message}`);
    } finally {
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
        return;
      }
      
      const result = await request(permission);
      setPermissionStatus(result);
      
      if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
        Alert.alert('Success', 'Permission granted!');
      } else {
        Alert.alert('Error', `Permission not granted: ${result}`);
      }
    } catch (err) {
      setError(`Error requesting permission: ${err.message}`);
      Alert.alert('Error', `Failed to request permission: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const contacts = await ContactService.getAllContacts();
      setContactsCount(contacts.length);
      
      Alert.alert('Success', `Retrieved ${contacts.length} contacts`);
    } catch (err) {
      setError(`Error getting contacts: ${err.message}`);
      Alert.alert('Error', `Failed to get contacts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? colors.dark.default : colors.light.default,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? colors.dark.border : colors.light.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? colors.white : colors.black,
      marginLeft: 16,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? colors.white : colors.black,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: isDarkMode ? colors.white : colors.black,
      marginBottom: 4,
    },
    errorText: {
      fontSize: 14,
      color: colors.error,
      marginTop: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 16,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginRight: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    buttonText: {
      color: colors.white,
      fontWeight: 'bold',
    },
    statusContainer: {
      padding: 8,
      borderRadius: 8,
      marginTop: 8,
    },
    statusText: {
      fontWeight: 'bold',
    },
  });

  const getStatusStyle = (status) => {
    if (status === true || status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      return {
        backgroundColor: 'rgba(0, 200, 0, 0.2)',
        color: '#00a000',
      };
    } else {
      return {
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        color: '#ff0000',
      };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-back"
            size={24}
            color={isDarkMode ? colors.white : colors.black}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contacts Debug</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: 20 }}
          />
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Module Status</Text>
          {moduleStatus ? (
            <>
              <View style={[
                styles.statusContainer,
                { backgroundColor: moduleStatus.isAvailable ? 'rgba(0, 200, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: moduleStatus.isAvailable ? '#00a000' : '#ff0000' }
                ]}>
                  Overall Status: {moduleStatus.isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}
                </Text>
              </View>
              <Text style={styles.infoText}>
                Native Module: {moduleStatus.nativeModuleAvailable ? 'Available ✅' : 'Not Available ❌'}
              </Text>
              <Text style={styles.infoText}>
                JS Module: {moduleStatus.jsModuleAvailable ? 'Available ✅' : 'Not Available ❌'}
              </Text>
              {moduleStatus.error && (
                <Text style={styles.errorText}>Error: {moduleStatus.error}</Text>
              )}
            </>
          ) : (
            <Text style={styles.infoText}>Not checked yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Details</Text>
          {platformDetails ? (
            <>
              <Text style={styles.infoText}>OS: {platformDetails.os}</Text>
              <Text style={styles.infoText}>Version: {platformDetails.version}</Text>
            </>
          ) : (
            <Text style={styles.infoText}>Not checked yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permission Status</Text>
          {permissionStatus ? (
            <View style={[
              styles.statusContainer,
              getStatusStyle(permissionStatus)
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusStyle(permissionStatus).color }
              ]}>
                {permissionStatus}
              </Text>
            </View>
          ) : (
            <Text style={styles.infoText}>Not checked yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacts Test</Text>
          {contactsCount !== null ? (
            <Text style={styles.infoText}>
              Retrieved {contactsCount} contacts
            </Text>
          ) : (
            <Text style={styles.infoText}>Not tested yet</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={checkModuleStatus}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Check Module</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={checkPermission}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Check Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={requestPermission}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Request Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testGetContacts}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Get Contacts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ContactsDebugScreen;
