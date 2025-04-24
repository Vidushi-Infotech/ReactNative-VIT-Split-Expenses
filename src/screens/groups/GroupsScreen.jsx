import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import GroupService from '../../services/GroupService';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getColorWithOpacity, shadows } from '../../theme/theme';

const GroupsScreen = ({ navigation }) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animation values
  const headerOpacity = useSharedValue(1);
  const addButtonScale = useSharedValue(1);

  // Fetch groups when component mounts or when refreshing
  useEffect(() => {
    fetchGroups();
  }, [userProfile]);

  // Function to fetch groups from Firebase
  const fetchGroups = async () => {
    if (!userProfile || !userProfile.id) {
      console.log('No user profile found, cannot fetch groups');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching groups for user:', userProfile.id);
      const userGroups = await GroupService.getUserGroups(userProfile.id);
      console.log('Fetched groups:', userGroups.length);
      setGroups(userGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    // We don't need to filter here as we'll filter in the render
  };

  // Filter groups based on search query
  const filteredGroups = searchQuery.trim()
    ? groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : groups;

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  // Animated styles
  const addButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: addButtonScale.value }]
    };
  });

  const renderGroupItem = ({ item, index }) => {
    // Calculate a random delay for staggered animation
    const animationDelay = index * 100;

    return (
      <Animated.View
        entering={FadeInRight.delay(animationDelay).duration(400)}
      >
        <TouchableOpacity
          style={[styles.groupCard, { backgroundColor: themeColors.surface }]}
          onPress={() => navigation.navigate('GroupDetails', { groupId: item.id })}
          onPressIn={() => {
            addButtonScale.value = withSpring(0.95);
          }}
          onPressOut={() => {
            addButtonScale.value = withSpring(1);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.groupImageContainer}>
            <Image source={{ uri: item.image }} style={styles.groupImage} />
            <View style={[styles.groupImageOverlay, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.3) }]} />
            <View style={styles.groupMembersCount}>
              <Icon name="people" size={12} color={themeColors.white} />
              <Text style={styles.groupMembersCountText}>{item.members.length}</Text>
            </View>
          </View>

          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: themeColors.text }]}>{item.name}</Text>
            <View style={styles.groupMeta}>
              <View style={styles.metaItem}>
                <Icon name="calendar-outline" size={14} color={themeColors.primary.default} />
                <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                  {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <View style={[styles.categoryTag, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.1) }]}>
                <Text style={[styles.categoryTagText, { color: themeColors.primary.default }]}>
                  {item.name.includes('Trip') ? 'Trip' : item.name.includes('Dinner') ? 'Food' : 'Group'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.arrowButton, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.1) }]}
            onPress={() => navigation.navigate('GroupDetails', { groupId: item.id })}
          >
            <Icon name="chevron-forward" size={16} color={themeColors.primary.default} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <View style={styles.headerContent}>
            <View>
              <Animated.Text
                entering={FadeInDown.duration(800)}
                style={[styles.title, { color: themeColors.text }]}
              >
                My Groups
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(200).duration(800)}
                style={[styles.subtitle, { color: themeColors.textSecondary }]}
              >
                Track and split expenses with friends
              </Animated.Text>
            </View>

            <Animated.View style={addButtonAnimatedStyle}>
              {/* <TouchableOpacity
                style={[styles.addButton, { backgroundColor: themeColors.primary.default }]}
                onPress={handleCreateGroup}
                onPressIn={() => {
                  addButtonScale.value = withSpring(0.9);
                }}
                onPressOut={() => {
                  addButtonScale.value = withSpring(1);
                }}
              >
                <Icon name="add" size={24} color={themeColors.white} />
              </TouchableOpacity> */}
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(800)}
            style={styles.searchContainer}
          >
            <View style={[styles.searchInputContainer, { backgroundColor: isDarkMode ? themeColors.dark.light : themeColors.light.dark }]}>
              <Icon name="search-outline" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: themeColors.text }]}
                placeholder="Search groups..."
                placeholderTextColor={themeColors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={16} color={themeColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </Animated.View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary.default} />
            <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading groups...</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={filteredGroups}
              renderItem={renderGroupItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              ListEmptyComponent={() => (
                <Animated.View
                  entering={FadeInDown.duration(800)}
                  style={styles.emptyContainer}
                >
                  <Icon name="people-outline" size={60} color={getColorWithOpacity(themeColors.primary.default, 0.5)} />
                  <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Groups Yet</Text>
                  <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>Create a group to start splitting expenses with friends</Text>
                  <TouchableOpacity
                    style={[styles.emptyButton, { backgroundColor: themeColors.primary.default }]}
                    onPress={handleCreateGroup}
                  >
                    <Icon name="add" size={20} color={themeColors.white} style={{ marginRight: 8 }} />
                    <Text style={styles.emptyButtonText}>Create Group</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            />

            <Animated.View style={addButtonAnimatedStyle}>
              <TouchableOpacity
                style={[styles.fab, { backgroundColor: themeColors.primary.default }]}
                onPress={handleCreateGroup}
                onPressIn={() => {
                  addButtonScale.value = withSpring(0.9);
                }}
                onPressOut={() => {
                  addButtonScale.value = withSpring(1);
                }}
              >
                <Icon name="add" size={24} color={themeColors.white} />
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
    padding: 0,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  groupCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 20,
    padding: 12,
    ...shadows.md,
    alignItems: 'center',
  },
  groupImageContainer: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  groupImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  groupMembersCount: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMembersCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  groupInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  groupMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    ...shadows.sm,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default GroupsScreen;
