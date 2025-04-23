import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import AvatarGroup from '../common/AvatarGroup';
import Card from '../common/Card';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { colors, spacing, fontSizes } from '../../theme/theme';

const GroupCard = ({ group, index }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  const handlePress = () => {
    navigation.navigate('GroupDetails', { groupId: group.id });
  };

  return (
    <Animated.View
      entering={FadeInRight.duration(800).delay(index * 100)}
      style={styles.container}
    >
      <Card variant="elevated" onPress={handlePress}>
        <View style={styles.cardContent}>
          <Image
            source={{ uri: group.image }}
            style={styles.groupImage}
            resizeMode="cover"
          />

          <View style={styles.groupInfo}>
            <Text
              style={[styles.groupName, { color: isDarkMode ? colors.white : colors.dark.default }]}
              numberOfLines={1}
            >
              {group.name}
            </Text>

            <View style={styles.groupMembersRow}>
              <AvatarGroup users={group.members} max={3} size="sm" />

              <Text style={[styles.membersCount, { color: isDarkMode ? colors.gray[300] : colors.gray[600] }]}>
                {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  cardContent: {
    flexDirection: 'row',
  },
  groupImage: {
    width: 64, // 16 * 4
    height: 64, // 16 * 4
    borderRadius: 8,
    marginRight: spacing.lg,
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  groupMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membersCount: {
    marginLeft: spacing.sm,
  },
});

export default GroupCard;
