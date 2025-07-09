import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Clipboard,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import firebaseService from '../services/firebaseService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ReferralSystemScreen = ({ onClose }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [referralData, setReferralData] = useState({
    code: '',
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    referralHistory: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const generateReferralCode = (userId, name) => {
    // Generate unique referral code based on user ID and name
    const namePrefix = name ? name.substring(0, 2).toUpperCase() : 'SP';
    const userIdSuffix = userId.substring(userId.length - 6).toUpperCase();
    return `${namePrefix}${userIdSuffix}`;
  };

  const loadReferralData = async () => {
    setLoading(true);
    try {
      console.log('🎁 Loading referral data for user:', user?.uid);
      
      // Get user profile for name
      const userProfile = await firebaseService.getUserProfile(user.uid);
      const userName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : 'User';
      
      // Generate or get existing referral code
      let referralCode = generateReferralCode(user.uid, userName);
      
      // Get user's referral statistics from database
      const referralStats = await firebaseService.getUserReferralStats(user.uid);
      
      // Get referral history (users who used this user's code)
      const referralHistory = await firebaseService.getReferralHistory(user.uid);
      
      console.log('🎁 Referral stats:', referralStats);
      console.log('🎁 Referral history:', referralHistory);
      
      setReferralData({
        code: referralCode,
        totalReferrals: referralHistory.length,
        successfulReferrals: referralHistory.filter(r => r.status === 'completed').length,
        pendingReferrals: referralHistory.filter(r => r.status === 'pending').length,
        referralHistory: referralHistory
      });
      
    } catch (error) {
      console.error('🎁 Error loading referral data:', error);
      Alert.alert('Error', 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadReferralData();
    } catch (error) {
      console.error('🎁 Error refreshing referral data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await Clipboard.setString(referralData.code);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy referral code');
    }
  };

  const shareReferralCode = async () => {
    try {
      const shareMessage = `🎉 Join me on Splitzy - the best expense splitting app!\n\n` +
        `Use my referral code: ${referralData.code}\n\n` +
        `📱 Download Splitzy and split expenses easily with friends!\n` +
        `💰 Track group expenses and settlements\n` +
        `🚀 Simple, fast, and reliable\n\n` +
        `Use code: ${referralData.code} during signup to get started!`;

      await Share.share({
        message: shareMessage,
        title: 'Join Splitzy with my referral code!'
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
      Alert.alert('Error', 'Failed to share referral code');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral System</Text>
        <View style={styles.headerSpacer} />
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
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading referral data...</Text>
          </View>
        ) : (
          <>
            {/* Referral Code Card */}
            <View style={styles.codeCard}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeTitle}>Your Referral Code</Text>
                <View style={styles.giftIcon}>
                  <MaterialIcons name="card-giftcard" size={24} color={theme.colors.primary} />
                </View>
              </View>
              
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{referralData.code}</Text>
                <TouchableOpacity style={styles.copyButton} onPress={copyReferralCode}>
                  <MaterialIcons name="content-copy" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.shareButton} onPress={shareReferralCode}>
                <Ionicons name="share" size={20} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share with Friends</Text>
              </TouchableOpacity>
            </View>

            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{referralData.totalReferrals}</Text>
                <Text style={styles.statLabel}>Total Referrals</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>{referralData.successfulReferrals}</Text>
                <Text style={styles.statLabel}>Successful</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{referralData.pendingReferrals}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {/* How it Works */}
            <View style={styles.howItWorksCard}>
              <Text style={styles.sectionTitle}>How Referrals Work</Text>
              <View style={styles.stepContainer}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Share your referral code with friends</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Friends sign up using your code</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Track your referrals and earn rewards</Text>
                </View>
              </View>
            </View>

            {/* Referral History */}
            <View style={styles.historyCard}>
              <Text style={styles.sectionTitle}>Referral History</Text>
              
              {referralData.referralHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="people" size={64} color={theme.colors.textMuted} />
                  <Text style={styles.emptyText}>No referrals yet</Text>
                  <Text style={styles.emptySubtext}>Share your code to start earning referrals!</Text>
                </View>
              ) : (
                referralData.referralHistory.map((referral) => (
                  <View key={referral.id} style={styles.referralItem}>
                    <View style={styles.referralInfo}>
                      <Text style={styles.referralName}>{referral.referredUserName || 'New User'}</Text>
                      <Text style={styles.referralDate}>Joined {formatDate(referral.createdAt)}</Text>
                    </View>
                    <View style={styles.referralStatus}>
                      <Ionicons 
                        name={getStatusIcon(referral.status)} 
                        size={20} 
                        color={getStatusColor(referral.status)} 
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(referral.status) }]}>
                        {referral.status}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
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
  codeCard: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  giftIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.borderLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeText: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 4,
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
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  howItWorksCard: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  stepContainer: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  referralStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
});

export default ReferralSystemScreen;