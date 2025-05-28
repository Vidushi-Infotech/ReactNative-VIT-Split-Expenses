import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Clipboard,
  ToastAndroid,
  Platform,
  FlatList,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import UserService from '../../services/UserService';

const ReferralScreen = () => {
  const { colors: themeColors } = useTheme();
  const { userProfile, updateProfile } = useAuth();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [referralTree, setReferralTree] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Load referral data and fetch referral tree
  useEffect(() => {
    // Load referral data from user profile
    if (userProfile) {
      // Generate a referral code if not already present
      if (!userProfile.referralCode) {
        generateReferralCode();
      } else {
        setReferralCode(userProfile.referralCode);
        // Fetch users who used this referral code
        fetchReferralTree(userProfile.referralCode);
      }

      // Set referred by if available
      if (userProfile.referredBy) {
        setReferredBy(userProfile.referredBy);
      }
    }
  }, [userProfile]);

  // Fetch users who have used this referral code
  const fetchReferralTree = async (code) => {
    if (!code) return;

    setLoadingReferrals(true);
    try {
      console.log('Fetching referral tree for code:', code);
      const referredUsers = await UserService.getUsersByReferralCode(code);
      console.log('Referred users:', referredUsers);
      setReferralTree(referredUsers);
    } catch (error) {
      console.error('Error fetching referral tree:', error);
      Alert.alert('Error', 'Failed to load your referral network. Please try again.');
    } finally {
      setLoadingReferrals(false);
    }
  };

  // Generate a unique referral code based on user ID and random characters
  const generateReferralCode = async () => {
    setLoading(true);
    try {
      if (!userProfile || !userProfile.id) {
        throw new Error('User profile not available');
      }

      // Create a referral code using the first 4 characters of the user ID and 4 random characters
      const userIdPart = userProfile.id.substring(0, 4).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newReferralCode = `${userIdPart}-${randomPart}`;

      // Update the user profile with the new referral code
      const success = await updateProfile({
        referralCode: newReferralCode
      });

      if (success) {
        setReferralCode(newReferralCode);
        // Fetch users who used this referral code (should be empty for a new code)
        fetchReferralTree(newReferralCode);
      } else {
        throw new Error('Failed to update referral code');
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
      Alert.alert('Error', 'Failed to generate referral code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy referral code to clipboard
  const copyReferralCode = () => {
    Clipboard.setString(referralCode);

    // Show toast on Android or alert on iOS
    if (Platform.OS === 'android') {
      ToastAndroid.show('Referral code copied to clipboard', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'Referral code copied to clipboard');
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Referral System</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Referral Code Section */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <View style={styles.sectionHeader}>
              <Icon name="code-outline" size={24} color={themeColors.primary.default} />
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Reference Code</Text>
            </View>

            <View style={[styles.codeContainer, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.1) }]}>
              {loading ? (
                <ActivityIndicator size="small" color={themeColors.primary.default} />
              ) : (
                <>
                  <Text style={[styles.codeText, { color: themeColors.primary.default }]}>
                    {referralCode || 'Generating...'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.copyButton, { backgroundColor: themeColors.primary.default }]}
                    onPress={copyReferralCode}
                    disabled={!referralCode}
                  >
                    <Icon name="copy-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              )}
            </View>

            <Text style={[styles.sectionDescription, { color: themeColors.textSecondary }]}>
              Share this code with friends to invite them to CostSync
            </Text>
          </View>

          {/* Referred By Section */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <View style={styles.sectionHeader}>
              <Icon name="person-add-outline" size={24} color={themeColors.primary.default} />
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Referred By</Text>
            </View>

            {referredBy ? (
              <Text style={[styles.referredByText, { color: themeColors.text }]}>
                {referredBy}
              </Text>
            ) : (
              <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
                You haven't been referred by anyone
              </Text>
            )}
          </View>

          {/* Referral Tree Visualization */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <View style={styles.sectionHeader}>
              <Icon name="git-network-outline" size={24} color={themeColors.primary.default} />
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Referral Tree</Text>
            </View>

            <View style={styles.treeContainer}>
              {loadingReferrals ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={themeColors.primary.default} />
                  <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                    Loading your referral network...
                  </Text>
                </View>
              ) : referralTree.length > 0 ? (
                <FlatList
                  data={referralTree}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={[styles.referralItem, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.05) }]}>
                      <View style={styles.referralUserInfo}>
                        {item.avatar ? (
                          <Image
                            source={{ uri: item.avatar }}
                            style={styles.userAvatar}
                          />
                        ) : (
                          <View style={[styles.userAvatarPlaceholder, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.2) }]}>
                            <Icon name="person" size={20} color={themeColors.primary.default} />
                          </View>
                        )}
                        <View style={styles.userDetails}>
                          <Text style={[styles.userName, { color: themeColors.text }]}>
                            {item.name || 'User'}
                          </Text>
                          <Text style={[styles.userPhone, { color: themeColors.textSecondary }]}>
                            {item.phoneNumber ? `+${item.phoneNumber}` : 'No phone number'}
                          </Text>
                        </View>
                      </View>
                      <Icon
                        name="checkmark-circle"
                        size={20}
                        color={themeColors.success}
                      />
                    </View>
                  )}
                  ListHeaderComponent={
                    <Text style={[styles.referralListHeader, { color: themeColors.textSecondary }]}>
                      {referralTree.length} {referralTree.length === 1 ? 'user' : 'users'} joined using your code
                    </Text>
                  }
                  contentContainerStyle={styles.referralList}
                  scrollEnabled={false}
                />
              ) : (
                <View style={[styles.emptyTreeState, { borderColor: getColorWithOpacity(themeColors.primary.default, 0.3) }]}>
                  <Icon
                    name="people-outline"
                    size={40}
                    color={getColorWithOpacity(themeColors.primary.default, 0.5)}
                  />
                  <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
                    No one has used your referral code yet
                  </Text>
                  <Text style={[styles.emptyStateSubText, { color: themeColors.textSecondary }]}>
                    Share your code with friends to grow your network
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

// Helper function to get color with opacity
const getColorWithOpacity = (color, opacity) => {
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginTop: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
  },
  referredByText: {
    fontSize: 16,
    padding: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 8,
  },
  treeContainer: {
    minHeight: 150,
  },
  emptyTreeState: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateSubText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 10,
  },
  referralList: {
    paddingVertical: 8,
  },
  referralListHeader: {
    fontSize: 14,
    marginBottom: 12,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  referralUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userPhone: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default ReferralScreen;
