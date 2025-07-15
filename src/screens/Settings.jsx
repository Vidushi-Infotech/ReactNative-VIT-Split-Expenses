
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';
import Notification from './Notification';
import AccountPrivacy from './AccountPrivacy';
import DevicePermission from './DevicePermission';
import Language from './Language';
import CurrencyPreference from './CurrencyPreference';
import DeleteAccount from './DeleteAccount';

const Settings = ({navigation, onClose}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [showNotification, setShowNotification] = useState(false);
    const [showAccountPrivacy, setShowAccountPrivacy] = useState(false);
    const [showDevicePermission, setShowDevicePermission] = useState(false);
    const [showLanguage, setShowLanguage] = useState(false);
    const [showCurrencyPreference, setShowCurrencyPreference] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);

    const menuItems = [
    {
      id: 1,
      title: 'Notifications',
      iconComponent: <Ionicons name="notifications" size={20} color={theme.colors.icon} />,
      onPress: () => setShowNotification(true),
    },
    {
      id: 2,
      title: 'Account Privacy',
      iconComponent: <Ionicons name="person-circle" size={20} color={theme.colors.icon} />,
      onPress: () => setShowAccountPrivacy(true),
    },
    {
      id: 3,
      title: 'Device Permissions',
      iconComponent: <Ionicons name="shield-checkmark" size={20} color={theme.colors.icon} />,
        onPress: () => setShowDevicePermission(true),
    },
    {
      id: 4,
      title: 'Language',
      iconComponent: <Ionicons name="language" size={20} color={theme.colors.icon} />,
      onPress: () => setShowLanguage(true),
    },
    {
      id: 5,
      title: 'Currency Preference',
      iconComponent: <Ionicons name="logo-usd" size={20} color={theme.colors.icon} />,
      onPress: () => setShowCurrencyPreference(true),
    },
    {
      id: 6,
      title: 'Delete Account',
      iconComponent: <Ionicons name="trash" size={20} color={theme.colors.icon} />,
      onPress: () => setShowDeleteAccount(true),
    },
  ];
    
  return (
    <SafeAreaView style={styles.container}>
        <StatusBar
        barStyle={theme.colors.statusBarStyle}
        backgroundColor={theme.colors.statusBarBackground}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.option}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                {item.iconComponent}
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>
                  {item.title}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.icon}
              style={styles.optionChevron}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Notification Modal */}
      <Modal
        visible={showNotification}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <Notification onClose={() => setShowNotification(false)} />
      </Modal>

      {/* Account Privacy Modal */}
      <Modal
        visible={showAccountPrivacy}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AccountPrivacy onClose={() => setShowAccountPrivacy(false)} />
        </Modal>

      {/* Device Permission Modal */}
      <Modal
        visible={showDevicePermission}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <DevicePermission onClose={() => setShowDevicePermission(false)} />
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={showLanguage}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <Language onClose={() => setShowLanguage(false)} />
            </Modal>

      {/* Currency Preference Modal */}
      <Modal
        visible={showCurrencyPreference}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CurrencyPreference onClose={() => setShowCurrencyPreference(false)} />
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteAccount}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <DeleteAccount onClose={() => setShowDeleteAccount(false)} />
      </Modal>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    placeholder: {
      width: 32,
    },
    scrollView: {
      flex: 1,
    },
    menuSection: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 1,
      marginBottom: 1,
      borderRadius: 12,
      shadowColor: theme.colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    optionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  })

export default Settings

