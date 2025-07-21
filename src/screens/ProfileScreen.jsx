import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import EditProfileScreen from './EditProfileScreen';
import ThemeSettingsScreen from './ThemeSettingsScreen';
import PaymentHistoryScreen from './PaymentHistoryScreen';
import ReferralSystemScreen from './ReferralSystemScreen';
import ThemedAlert from '../components/ThemedAlert';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import firebaseService from '../services/firebaseService';
import Settings from './Settings';
import HelpandSupport from './HelpandSupport';

const ProfileScreen = ({ navigation }) => {
  const { signOut, user, isAndroid, loading } = useAuth();
  const { theme, themeMode, getThemeDisplayName, getThemeIcon, setTheme } = useTheme();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showReferralSystem, setShowReferralSystem] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelpandSupport, setShowHelpandSupport] = useState(false);

  // Debug theme context
  console.log('ProfileScreen - Theme Mode:', themeMode);
  console.log('ProfileScreen - Theme:', theme?.mode);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }
    
    setLoadingProfile(true);
    try {
      const profile = await firebaseService.getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        // Use Firebase Auth data as fallback
        setUserProfile({
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          profileImageUrl: user.photoURL || null,
        });
      }
    } catch (error) {
      console.log('Error loading profile:', error);
      // Use Firebase Auth data as fallback
      setUserProfile({
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        profileImageUrl: user.photoURL || null,
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Theme settings handlers
  const handleThemeSettings = () => {
    console.log('🎨 Theme Settings button pressed!');
    console.log('🎨 Current showThemeSettings state:', showThemeSettings);
    setShowThemeSettings(true);
    console.log('🎨 Setting showThemeSettings to true');
  };

  const handleCloseThemeSettings = () => {
    setShowThemeSettings(false);
  };

  const handleLogout = () => {
    setShowLogoutAlert(true);
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log('🔥 Starting logout process...');

      await signOut();

      console.log('✅ Logout successful!');
      // Navigation will be handled automatically by auth state change

    } catch (error) {
      console.error('❌ Logout error:', error);

      // Show user-friendly error message
      let errorMessage = 'Failed to logout. Please try again.';

      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }

      // For now, just log the error - we can add a themed error alert later if needed
      console.error('Logout failed:', errorMessage);
    } finally {
      setIsLoggingOut(false);
    }
  };
  // Dynamic logout button configuration
  const getLogoutButtonConfig = () => {
    if (isLoggingOut) {
      return {
        title: 'Logging out...',
        iconComponent: <MaterialIcons name="logout" size={20} color={theme.colors.textMuted} />,
        disabled: true,
        textColor: theme.colors.textMuted,
      };
    }

    // Check if user is actually authenticated
    if (user && !loading) {
      return {
        title: 'Logout',
        iconComponent: <MaterialIcons name="logout" size={20} color={theme.colors.error || '#EF4444'} />,
        disabled: false,
        textColor: theme.colors.error || '#EF4444',
      };
    }

    // User not authenticated
    return {
      title: 'Not Signed In',
      iconComponent: <MaterialIcons name="person-off" size={20} color={theme.colors.textSecondary} />,
      disabled: true,
      textColor: theme.colors.textSecondary,
    };
  };

  const logoutConfig = getLogoutButtonConfig();

  const menuItems = [
    {
      id: 1,
      title: 'Theme Setting',
      subtitle: getThemeDisplayName(themeMode),
      iconComponent: <Ionicons name={getThemeIcon(themeMode)} size={20} color={theme.colors.icon} />,
      onPress: () => {
        console.log('🎨 Theme Setting menu item clicked!');
        handleThemeSettings();
      },
    },
    {
      id: 2,
      title: 'Payments',
      iconComponent: <Ionicons name="card" size={20} color={theme.colors.icon} />,
      onPress: () => setShowPaymentHistory(true),
    },
    {
      id: 3,
      title: 'Settings',
      iconComponent: <Ionicons name="settings" size={20} color={theme.colors.icon} />,
      onPress: () => setShowSettings(true),
    },
    {
      id: 4,
      title: 'Referral System',
      iconComponent: <FontAwesome name="gift" size={20} color={theme.colors.icon} />,
      onPress: () => setShowReferralSystem(true),
    },
    {
      id: 5,
      title: 'Help & Support',
      iconComponent: <Ionicons name="help-circle" size={20} color={theme.colors.icon} />,
      onPress: () => setShowHelpandSupport(true),
    },
    {
      id: 6,
      title: logoutConfig.title,
      iconComponent: logoutConfig.iconComponent,
      onPress: logoutConfig.disabled ? null : handleLogout,
      disabled: logoutConfig.disabled,
      textColor: logoutConfig.textColor,
      isLogout: true,
    },
  ];

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleCloseEditProfile = () => {
    setShowEditProfile(false);
    // Reload profile data when edit profile closes
    loadUserProfile();
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {loadingProfile ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : (
                <Image
                  source={{ 
                    uri: userProfile?.profileImageUrl || 
                         (user?.photoURL) ||
                         `https://via.placeholder.com/150x150/333/fff?text=${
                           userProfile?.firstName ? userProfile.firstName.charAt(0) : 
                           user?.displayName ? user.displayName.charAt(0) : 'U'
                         }`
                  }}
                  style={styles.avatar}
                />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {loadingProfile ? 'Loading...' : (
                  userProfile ? 
                    `${userProfile.firstName} ${userProfile.lastName}`.trim() || 'User' :
                    (isAndroid && user ? (user.displayName || 'User') : 'User')
                )}
              </Text>
              <Text style={styles.userEmail}>
                {loadingProfile ? 'Loading...' : (
                  userProfile?.email || 
                  (isAndroid && user ? user.email : 'user@email.com')
                )}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <MaterialIcons name="edit" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.disabled && styles.menuItemDisabled,
                item.isLogout && isLoggingOut && styles.menuItemLoading
              ]}
              onPress={item.onPress}
              disabled={item.disabled}
              activeOpacity={item.disabled ? 1 : 0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  {item.iconComponent}
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[
                    styles.menuTitle,
                    item.textColor && { color: item.textColor },
                    item.disabled && styles.menuTitleDisabled
                  ]}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={styles.menuSubtitle}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </View>

              {/* Show loading indicator for logout */}
              {item.isLogout && isLoggingOut ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#9CA3AF" />
                </View>
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={item.disabled ? "#E5E7EB" : "#CBD5E0"}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <EditProfileScreen onClose={handleCloseEditProfile} />
      </Modal>

      {/* Theme Settings Modal */}
      <Modal
        visible={showThemeSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemeSettingsScreen onClose={handleCloseThemeSettings} />
      </Modal>

      {/* Payment History Modal */}
      <Modal
        visible={showPaymentHistory}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PaymentHistoryScreen onClose={() => setShowPaymentHistory(false)} />
      </Modal>

      {/* Referral System Modal */}
      <Modal
        visible={showReferralSystem}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ReferralSystemScreen onClose={() => setShowReferralSystem(false)} />
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <Settings onClose={() => setShowSettings(false)} />
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={showHelpandSupport}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <HelpandSupport onClose={() => setShowHelpandSupport(false)} />
      </Modal>

      {/* Themed Logout Alert */}
      <ThemedAlert
        visible={showLogoutAlert}
        title={user && !loading ? 'Logout Confirmation' : 'Authentication Status'}
        message={
          user && !loading
            ? `Are you sure you want to logout?\n\nYou are currently signed in as:\n${userProfile?.email || user?.email || 'Unknown User'}\n\nName: ${userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : user?.displayName || 'Not set'}`
            : 'You are not currently signed in. Please login to access your account.'
        }
        buttons={
          user && !loading
            ? [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => setShowLogoutAlert(false),
                },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: () => {
                    setShowLogoutAlert(false);
                    performLogout();
                  },
                },
              ]
            : [
                {
                  text: 'OK',
                  style: 'default',
                  onPress: () => setShowLogoutAlert(false),
                },
              ]
        }
        onClose={() => setShowLogoutAlert(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
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
  profileSection: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  editButton: {
    padding: 8,
  },
  menuSection: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuItemLoading: {
    backgroundColor: theme.colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  menuTitleDisabled: {
    color: theme.colors.textMuted,
  },
  loadingContainer: {
    paddingHorizontal: 4,
  },
});

export default ProfileScreen;