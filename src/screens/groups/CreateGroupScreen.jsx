import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mockUsers } from '../../utils/mockData';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { spacing, fontSizes } from '../../theme/theme';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

const CreateGroupScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupImage, setGroupImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { colors: themeColors } = useTheme();

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

  // Filter users based on search query
  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (user) => {
    if (selectedUsers.some((selectedUser) => selectedUser.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((selectedUser) => selectedUser.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSelectImage = () => {
    // In a real app, we would use react-native-image-picker here
    // For demo purposes, we'll just set a random image
    const demoImages = [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
      'https://images.unsplash.com/photo-1520333789090-1afc82db536a',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
      'https://images.unsplash.com/photo-1469571486292-b5175cb0e95b',
    ];
    const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];
    setGroupImage(randomImage);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      // Show error in a real app
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Groups');
    }, 1500);
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
      <Animated.View
        style={styles.photoContainer}
        entering={FadeInUp.duration(800)}
      >
        <TouchableOpacity
          onPress={handleSelectImage}
          style={styles.photoButton}
        >
          {groupImage ? (
            <Image
              source={{ uri: groupImage }}
              style={styles.groupImage}
            />
          ) : (
            <View
              style={[styles.imagePlaceholder, { backgroundColor: themeColors.surface }]}
            >
              <Icon name="image-outline" size={40} color={themeColors.textSecondary} />
            </View>
          )}

          <View
            style={[styles.cameraButton, { backgroundColor: themeColors.primary.default }]}
          >
            <Icon name="camera-outline" size={16} color={themeColors.white} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.photoText, { color: themeColors.textSecondary }]}>
          Add Group Photo
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(800).delay(100)}>
        <Input
          label="Group Name"
          placeholder="Enter group name"
          value={groupName}
          onChangeText={setGroupName}
          leftIcon={<Icon name="people-outline" size={20} color={themeColors.textSecondary} />}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(800).delay(200)}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Add Members
        </Text>

        <Input
          placeholder="Search by name or username"
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Icon name="search-outline" size={20} color={themeColors.textSecondary} />}
        />
      </Animated.View>

      {selectedUsers.length > 0 && (
        <Animated.View
          style={styles.selectedUsersContainer}
          entering={FadeInUp.duration(800).delay(300)}
        >
          <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
            Selected ({selectedUsers.length})
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectedUsersScroll}
          >
            {selectedUsers.map((user) => (
              <View key={user.id} style={styles.selectedUserItem}>
                <View style={styles.avatarContainer}>
                  <Avatar source={user.avatar} name={user.name} size="md" />
                  <TouchableOpacity
                    onPress={() => handleSelectUser(user)}
                    style={[styles.removeUserButton, { backgroundColor: themeColors.danger }]}
                  >
                    <Icon name="close" size={12} color={themeColors.white} />
                  </TouchableOpacity>
                </View>
                <Text
                  style={[styles.selectedUserName, { color: themeColors.textSecondary }]}
                  numberOfLines={1}
                >
                  {user.name.split(' ')[0]}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.duration(800).delay(400)}>
        <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
          Suggested
        </Text>

        {filteredUsers.length === 0 ? (
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            No users found
          </Text>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = selectedUsers.some((selectedUser) => selectedUser.id === user.id);
            const backgroundColor = isSelected
              ? getColorWithOpacity(themeColors.primary.default, 0.15) // 15% opacity
              : themeColors.surface;

            return (
              <TouchableOpacity
                key={user.id}
                onPress={() => handleSelectUser(user)}
                style={[styles.userItem, { backgroundColor }]}
              >
                <Avatar source={user.avatar} name={user.name} size="sm" />

                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: themeColors.text }]}>
                    {user.name}
                  </Text>
                  <Text style={[styles.userUsername, { color: themeColors.textSecondary }]}>
                    @{user.username}
                  </Text>
                </View>

                {isSelected && (
                  <Icon name="checkmark-circle" size={24} color={themeColors.primary.default} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </Animated.View>

      <Animated.View
        style={styles.buttonContainer}
        entering={FadeInUp.duration(800).delay(500)}
      >
        <Button
          title="Create Group"
          onPress={handleCreateGroup}
          loading={loading}
          disabled={!groupName.trim() || selectedUsers.length === 0}
          fullWidth
          size="lg"
        />
      </Animated.View>
    </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoButton: {
    position: 'relative',
  },
  groupImage: {
    width: 96, // 24 * 4
    height: 96, // 24 * 4
    borderRadius: 48,
  },
  imagePlaceholder: {
    width: 96, // 24 * 4
    height: 96, // 24 * 4
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 9999, // rounded-full
    padding: spacing.sm,
  },
  photoText: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  selectedUsersContainer: {
    marginBottom: spacing.lg,
  },
  selectedUsersScroll: {
    flexDirection: 'row',
  },
  selectedUserItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  removeUserButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 9999, // rounded-full
    padding: spacing.xs,
  },
  selectedUserName: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontWeight: '500',
  },
  userUsername: {
    fontSize: fontSizes.sm,
  },
  buttonContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});

export default CreateGroupScreen;
