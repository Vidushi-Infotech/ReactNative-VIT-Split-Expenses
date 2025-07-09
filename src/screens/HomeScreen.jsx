import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import CreateNewGroupScreen from './CreateNewGroupScreen';
import HomeSkeleton from '../components/HomeSkeleton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../context/ThemeContext';
import firebaseService from '../services/firebaseService';
import auth from '@react-native-firebase/auth';

const HomeScreen = ({navigation, route}) => {
  const {theme} = useTheme();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [overallBalance, setOverallBalance] = useState({
    netBalance: 0,
    totalYouOwe: 0,
    totalYouAreOwed: 0,
    groupBalanceDetails: [],
  });
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      setUser(user);
      if (user) {
        // Load both groups and overall balance
        Promise.all([loadUserGroups(user.uid), loadOverallBalance(user.uid)])
          .catch(error => {
            console.error('Error loading initial data:', error);
          })
          .finally(() => {
            setInitialLoading(false);
          });
      } else {
        setInitialLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Listen for route parameter changes to trigger reload
  useEffect(() => {
    if (route.params?.reload && user) {
      console.log('🔄 HomeScreen: Reload triggered from route params');
      Promise.all([
        loadUserGroups(user.uid),
        loadOverallBalance(user.uid),
      ]).catch(error => {
        console.error('Error reloading data:', error);
      });
    }
  }, [route.params?.reload, route.params?.timestamp, user]);

  const loadUserGroups = async userId => {
    setLoading(true);
    try {
      console.log('🏠 HomeScreen: Loading groups for user:', userId);

      // Load groups with detailed balance information
      const userGroups = await firebaseService.getUserGroups(userId);
      console.log(
        '🏠 HomeScreen: Loaded',
        userGroups.length,
        'groups from Firebase',
      );

      // Get detailed balance breakdown for each group
      const transformedGroups = await Promise.all(
        userGroups.map(async group => {
          try {
            const [groupBalances, groupMembers] = await Promise.all([
              firebaseService.calculateGroupBalances(group.id),
              firebaseService.getGroupMembersWithProfiles(group.id),
            ]);

            const userBalance = groupBalances[userId];
            const youOwe = userBalance?.net < 0 ? Math.abs(userBalance.net) : 0;
            const youAreOwed = userBalance?.net > 0 ? userBalance.net : 0;

            // Create member balance details for UI display
            const memberBalanceDetails = [];
            let balanceCount = 0;

            Object.entries(groupBalances).forEach(([memberId, balance]) => {
              if (memberId !== userId && balance.net !== 0) {
                const member = groupMembers.find(m => m.userId === memberId);
                if (member && balanceCount < 2) {
                  // Show max 2 details initially
                  if (balance.net > 0) {
                    // This member is owed money (you owe them)
                    memberBalanceDetails.push({
                      text: `You owe ${member.name}`,
                      amount: balance.net,
                      type: 'owe',
                    });
                  } else {
                    // This member owes money (they owe you)
                    memberBalanceDetails.push({
                      text: `${member.name} owes you`,
                      amount: Math.abs(balance.net),
                      type: 'owed',
                    });
                  }
                  balanceCount++;
                }
              }
            });

            // Count remaining balances
            const totalNonZeroBalances = Object.values(groupBalances).filter(
              (balance, index) =>
                Object.keys(groupBalances)[index] !== userId &&
                balance.net !== 0,
            ).length;

            const moreBalances =
              totalNonZeroBalances > 2 ? totalNonZeroBalances - 2 : 0;

            return {
              id: group.id,
              name: group.name,
              description: group.description,
              avatar: group.coverImageUrl ? null : '🎭',
              coverImageUrl: group.coverImageUrl,
              youOwe,
              youAreOwed,
              details: memberBalanceDetails,
              moreBalances: moreBalances > 0 ? moreBalances : null,
              members: group.members || [],
              createdAt: group.createdAt,
              totalExpenses: group.totalExpenses || 0,
            };
          } catch (groupError) {
            console.error('🏠 Error processing group:', group.id, groupError);
            return {
              id: group.id,
              name: group.name,
              description: group.description,
              avatar: '🎭',
              coverImageUrl: group.coverImageUrl,
              youOwe: 0,
              youAreOwed: 0,
              details: [],
              moreBalances: null,
              members: group.members || [],
              createdAt: group.createdAt,
              totalExpenses: group.totalExpenses || 0,
            };
          }
        }),
      );

      console.log(
        '🏠 HomeScreen: Transformed groups with details:',
        transformedGroups,
      );
      setGroups(transformedGroups);
    } catch (error) {
      console.error('🏠 HomeScreen: Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadOverallBalance = async userId => {
    setBalanceLoading(true);
    try {
      console.log('🏠 HomeScreen: Loading overall balance for user:', userId);
      const balance = await firebaseService.calculateOverallBalance(userId);
      console.log('🏠 HomeScreen: Overall balance loaded:', balance);
      setOverallBalance(balance);
    } catch (error) {
      console.error('🏠 HomeScreen: Error loading overall balance:', error);
      // Keep default zero values if error occurs
    } finally {
      setBalanceLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      await Promise.all([
        loadUserGroups(user.uid),
        loadOverallBalance(user.uid),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddGroup = () => {
    setShowCreateGroup(true);
  };

  const handleCloseCreateGroup = () => {
    setShowCreateGroup(false);
  };

  const handleSaveNewGroup = newGroup => {
    // Transform the new group to match the UI format
    const transformedGroup = {
      id: newGroup.id,
      name: newGroup.name,
      description: newGroup.description,
      avatar: newGroup.coverImageUrl ? null : '🎭',
      coverImageUrl: newGroup.coverImageUrl,
      youOwe: 0,
      youAreOwed: 0,
      details: [],
      members: newGroup.members || [],
      createdAt: newGroup.createdAt,
      totalExpenses: 0,
    };

    setGroups(prevGroups => [transformedGroup, ...prevGroups]);
    setShowCreateGroup(false);
  };

  const handleSearch = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) {
      setSearchQuery('');
    }
  };

  const handleSearchQueryChange = query => {
    setSearchQuery(query);
  };

  // Filter groups based on search query
  const filteredGroups = groups.filter(
    group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.details.some(detail =>
        detail.text.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const styles = createStyles(theme);

  // Show skeleton during initial loading
  if (initialLoading) {
    return <HomeSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleSearch}>
            <Ionicons
              name="search"
              size={24}
              color={showSearchBar ? '#4A90E2' : '#6B7280'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleAddGroup}>
            <MaterialIcons name="group-add" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearchBar && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#6B7280"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
              placeholder="Search groups, members, or expenses..."
              placeholderTextColor="#9CA3AF"
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

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
        }>
        {/* Overall Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.sectionTitle}>Overall Balance</Text>
          {balanceLoading ? (
            <View style={styles.balanceLoadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.balanceLoadingText}>Calculating...</Text>
            </View>
          ) : (
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Net Balance</Text>
                <Text
                  style={[
                    overallBalance.netBalance >= 0
                      ? styles.balanceAmountGreen
                      : styles.balanceAmountOrange,
                  ]}>
                  ₹{Math.abs(overallBalance.netBalance).toFixed(0)}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>You Get</Text>
                <Text style={styles.balanceAmountGreen}>
                  ₹{overallBalance.totalYouAreOwed.toFixed(0)}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>You Owe</Text>
                <Text style={styles.balanceAmountOrange}>
                  ₹{overallBalance.totalYouOwe.toFixed(0)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Groups Wise Expenses */}
        <View style={styles.groupsSection}>
          <Text style={styles.sectionTitle}>
            {searchQuery
              ? `Search Results (${filteredGroups.length})`
              : 'Groups Wise Expenses'}
          </Text>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading groups...</Text>
            </View>
          )}

          {!loading && searchQuery && filteredGroups.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={48} color="#9CA3AF" />
              <Text style={styles.noResultsText}>No groups found</Text>
              <Text style={styles.noResultsSubtext}>
                Try searching with different keywords
              </Text>
            </View>
          )}

          {!loading && groups.length === 0 && !searchQuery && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="people" size={48} color="#9CA3AF" />
              <Text style={styles.noResultsText}>No groups yet</Text>
              <Text style={styles.noResultsSubtext}>
                Create your first group to get started
              </Text>
            </View>
          )}

          {!loading &&
            (searchQuery ? filteredGroups : groups).map(group => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => navigation.navigate('GroupDetail', {group})}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupInfo}>
                    <View style={styles.avatarContainer}>
                      {group.coverImageUrl ? (
                        <Image
                          source={{uri: group.coverImageUrl}}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={styles.avatar}>{group.avatar}</Text>
                      )}
                    </View>
                    <Text style={styles.groupName}>{group.name}</Text>
                  </View>
                  <View style={styles.groupBalance}>
                    {group.youOwe > 0 && (
                      <>
                        <Text style={styles.balanceTypeOwe}>You owe</Text>
                        <Text style={styles.balanceAmountOrange}>
                          ₹{group.youOwe.toFixed(0)}
                        </Text>
                      </>
                    )}
                    {group.youAreOwed > 0 && (
                      <>
                        <Text style={styles.balanceTypeOwed}>You are owed</Text>
                        <Text style={styles.balanceAmountGreen}>
                          ₹{group.youAreOwed.toFixed(0)}
                        </Text>
                      </>
                    )}
                    {group.youOwe === 0 &&
                      group.youAreOwed === 0 &&
                      group.totalExpenses === 0 && (
                        <Text style={styles.balanceTypeSettled}>
                          No expenses yet
                        </Text>
                      )}
                  </View>
                </View>

                {/* Group Details */}
                <View style={styles.groupDetails}>
                  {group.details.map((detail, index) => (
                    <View key={index} style={styles.detailRow}>
                      <View style={styles.detailLine} />
                      <Text style={styles.detailText}>{detail.text}</Text>
                      <Text
                        style={
                          detail.type === 'owe'
                            ? styles.detailAmountOrange
                            : styles.detailAmountGreen
                        }>
                        ₹{detail.amount.toFixed(0)}
                      </Text>
                    </View>
                  ))}

                  {group.moreBalances && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailLine} />
                      <Text style={styles.moreBalancesText}>
                        📊 {group.moreBalances} more balances
                      </Text>
                    </View>
                  )}

                  {group.details.length === 0 && group.totalExpenses > 0 && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailLine} />
                      <Text style={styles.detailText}>✅ All settled up</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddGroup}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create New Group Modal */}
      <Modal
        visible={showCreateGroup}
        animationType="slide"
        presentationStyle="pageSheet">
        <CreateNewGroupScreen
          onClose={handleCloseCreateGroup}
          onSave={handleSaveNewGroup}
        />
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    headerActions: {
      flexDirection: 'row',
    },
    headerButton: {
      padding: 8,
      marginLeft: 12,
    },
    searchContainer: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.borderLight,
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    clearButton: {
      marginLeft: 8,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    balanceSection: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 0,
      shadowColor: theme.colors.text,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    balanceItem: {
      flex: 1,
      alignItems: 'center',
    },
    balanceDivider: {
      width: 1,
      height: 35,
      backgroundColor: '#E2E8F0',
      marginHorizontal: 8,
    },
    balanceLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 6,
      fontWeight: '500',
    },
    balanceAmountGreen: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#10B981',
    },
    balanceAmountOrange: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#F59E0B',
    },
    groupsSection: {
      paddingHorizontal: 16,
      paddingBottom: 100, // Space for floating button
    },
    groupCard: {
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
      borderRadius: 0,
      shadowColor: theme.colors.text,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    groupInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatar: {
      fontSize: 30,
    },
    avatarImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    groupName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginBottom: 4,
    },
    groupBalance: {
      alignItems: 'flex-end',
    },
    balanceTypeOwe: {
      fontSize: 14,
      color: '#F59E0B',
      marginBottom: 4,
      textAlign: 'right',
    },
    balanceTypeOwed: {
      fontSize: 14,
      color: '#10B981',
      marginBottom: 4,
      textAlign: 'right',
    },
    balanceTypeSettled: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 4,
      textAlign: 'right',
    },
    groupDetails: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    detailLine: {
      width: 2,
      height: 20,
      backgroundColor: '#E2E8F0',
      marginRight: 12,
      marginLeft: 30,
    },
    detailText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    detailAmountOrange: {
      fontSize: 14,
      fontWeight: '600',
      color: '#F59E0B',
    },
    detailAmountGreen: {
      fontSize: 14,
      fontWeight: '600',
      color: '#10B981',
    },
    detailAmountNeutral: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    moreBalancesText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textMuted,
      fontStyle: 'italic',
    },
    floatingButton: {
      position: 'absolute',
      bottom: 40,
      right: 24,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#4A90E2',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
    noResultsContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    noResultsText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    noResultsSubtext: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginTop: 8,
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
    balanceLoadingContainer: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    balanceLoadingText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
  });

export default HomeScreen;
