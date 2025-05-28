import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext.jsx';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import AvatarGroup from '../../../components/common/AvatarGroup.jsx';
import styles, { HEADER_HEIGHT } from './GroupDetailsStyles';

const GroupHeader = ({ group, totalExpenses, expenseCount, getUserById, scrollY }) => {
  const navigation = useNavigation();
  const { colors: themeColors, isDarkMode } = useTheme();

  // Create animated styles for parallax effect
  const headerImageAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, HEADER_HEIGHT / 3],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [1, 1.1],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateY },
        { scale }
      ]
    };
  });

  // Create animated styles for header title opacity
  const headerTitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity
    };
  });

  return (
    <View style={styles.headerContainer}>
      {/* Header Image with Parallax Effect */}
      <Animated.View style={[styles.headerImageContainer, headerImageAnimatedStyle]}>
        <Image
          source={{ uri: group.image }}
          style={styles.headerImage}
          resizeMode="cover"
          onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
        />

        {/* Gradient Overlay */}
        <View
          style={[styles.headerOverlay, {
            backgroundColor: isDarkMode
              ? 'rgba(0,0,0,0.7)'
              : 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))'
          }]}
        />
      </Animated.View>

      {/* Header Title Bar */}
      <Animated.View style={[styles.headerTitleContainer, headerTitleAnimatedStyle]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {group.name}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => navigation.navigate('GroupMembers', { group })}
            activeOpacity={0.7}
          >
            <Icon name="people-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Group Info Card */}
      <View style={styles.groupInfoContainer}>
        <Animated.View
          style={[
            styles.groupInfoCard,
            {
              backgroundColor: isDarkMode
                ? 'rgba(30, 30, 40, 0.9)'
                : 'rgba(255, 255, 255, 0.95)'
            }
          ]}
          entering={FadeInDown.duration(800)}
        >
          <View style={styles.groupInfoHeader}>
            <Text style={[styles.groupName, { color: themeColors.text }]}>
              {group.name}
            </Text>

            {group.description && (
              <Text style={[styles.groupDescription, { color: themeColors.textSecondary }]}>
                {group.description}
              </Text>
            )}

            <View style={[
              styles.groupStatsContainer,
              { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }
            ]}>
              <View style={styles.groupStat}>
                <Text style={[styles.groupStatValue, { color: themeColors.primary.default }]}>
                  ₹{totalExpenses.toFixed(0)}
                </Text>
                <Text style={[styles.groupStatLabel, { color: themeColors.textSecondary }]}>
                  Total
                </Text>
              </View>

              <View style={[styles.groupStatDivider, { backgroundColor: themeColors.border }]} />

              <View style={styles.groupStat}>
                <Text style={[styles.groupStatValue, { color: themeColors.primary.default }]}>
                  {expenseCount}
                </Text>
                <Text style={[styles.groupStatLabel, { color: themeColors.textSecondary }]}>
                  Expenses
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.groupMembersRow, { borderTopColor: themeColors.border }]}
            onPress={() => navigation.navigate('GroupMembers', { group })}
            activeOpacity={0.7}
          >
            <AvatarGroup
              users={group.members.map(memberId => getUserById(memberId))}
              max={4}
              size="sm"
            />
            <View style={styles.membersTextContainer}>
              <View style={styles.membersTextRow}>
                <Text style={[styles.membersText, { color: themeColors.textSecondary }]}>
                  {group.members.length} members
                </Text>
                {group.groupMetadata && group.groupMetadata.type === 'group' && group.groupMetadata.groups && group.groupMetadata.groups.length > 0 && (
                  <Text style={[styles.groupsText, { color: themeColors.textSecondary }]}>
                    • {group.groupMetadata.groups.length} groups
                  </Text>
                )}
              </View>
              <Icon
                name="chevron-forward"
                size={16}
                color={themeColors.textSecondary}
                style={styles.memberArrow}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default GroupHeader;
