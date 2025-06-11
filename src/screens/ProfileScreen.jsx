import React, { useState } from 'react';
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
} from 'react-native';
import EditProfileScreen from './EditProfileScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { signOut, user, isAndroid } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isAndroid) {
                await signOut();
                // Navigation will be handled automatically by auth state change
              } else {
                // For iOS, just show a message since Firebase Auth is not implemented
                Alert.alert('Demo Mode', 'Logout functionality will be available when Firebase Auth is implemented for iOS');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };
  const menuItems = [
    {
      id: 1,
      title: 'Theme Setting',
      iconComponent: <Ionicons name="moon" size={20} color="#6B7280" />,
      onPress: () => console.log('Theme Setting pressed'),
    },
    {
      id: 2,
      title: 'Payments',
      iconComponent: <Ionicons name="card" size={20} color="#6B7280" />,
      onPress: () => console.log('Payments pressed'),
    },
    {
      id: 3,
      title: 'Settings',
      iconComponent: <Ionicons name="settings" size={20} color="#6B7280" />,
      onPress: () => console.log('Settings pressed'),
    },
    {
      id: 4,
      title: 'Referral System',
      iconComponent: <FontAwesome name="gift" size={20} color="#6B7280" />,
      onPress: () => console.log('Referral System pressed'),
    },
    {
      id: 5,
      title: 'Help & Support',
      iconComponent: <Ionicons name="help-circle" size={20} color="#6B7280" />,
      onPress: () => console.log('Help & Support pressed'),
    },
    {
      id: 6,
      title: 'Logout',
      iconComponent: <MaterialIcons name="logout" size={20} color="#6B7280" />,
      onPress: handleLogout,
    },
  ];

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleCloseEditProfile = () => {
    setShowEditProfile(false);
  };

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
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {isAndroid && user ? (user.displayName || 'User') : 'Sagar Mali'}
              </Text>
              <Text style={styles.userEmail}>
                {isAndroid && user ? user.email : 'sagar@gmail.com'}
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
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  {item.iconComponent}
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#718096',
  },
  editButton: {
    padding: 8,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
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
    borderBottomColor: '#F7FAFC',
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
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
});

export default ProfileScreen;