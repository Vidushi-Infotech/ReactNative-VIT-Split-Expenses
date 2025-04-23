import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Avatar from './Avatar.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { colors, fontSizes } from '../../theme/theme.js';

const AvatarGroup = ({
  users,
  max = 3,
  size = 'md',
  showCount = true,
}) => {
  const { isDarkMode } = useTheme();

  // Determine overlap based on size
  const getOverlap = () => {
    switch (size) {
      case 'sm':
        return -12;
      case 'md':
        return -16;
      case 'lg':
        return -20;
      default:
        return -16;
    }
  };

  // Get size dimensions for count circle
  const getCountCircleSize = () => {
    switch (size) {
      case 'sm':
        return 32; // 8 * 4
      case 'md':
        return 48; // 12 * 4
      case 'lg':
        return 64; // 16 * 4
      default:
        return 48;
    }
  };

  // Get font size for count text
  const getCountTextSize = () => {
    switch (size) {
      case 'sm':
        return fontSizes.xs;
      case 'md':
        return fontSizes.sm;
      case 'lg':
        return fontSizes.base;
      default:
        return fontSizes.sm;
    }
  };

  // Visible users (limited by max)
  const visibleUsers = users.slice(0, max);
  // Number of remaining users
  const remainingCount = users.length - max;

  const countCircleSize = getCountCircleSize();
  const countTextSize = getCountTextSize();

  return (
    <View style={styles.container}>
      {visibleUsers.map((user, index) => (
        <View
          key={user.id}
          style={[
            styles.avatarContainer,
            { marginLeft: index === 0 ? 0 : getOverlap(), zIndex: 10 - index }
          ]}
        >
          <Avatar
            source={user.avatar}
            name={user.name}
            size={size}
            showBorder={true}
          />
        </View>
      ))}

      {remainingCount > 0 && showCount && (
        <View
          style={[
            styles.countContainer,
            {
              marginLeft: getOverlap(),
              width: countCircleSize,
              height: countCircleSize,
              backgroundColor: isDarkMode ? colors.dark.light : colors.light.dark,
              borderColor: isDarkMode ? colors.dark.default : colors.white,
            }
          ]}
        >
          <Text
            style={[
              styles.countText,
              {
                fontSize: countTextSize,
                color: isDarkMode ? colors.white : colors.dark.default,
              }
            ]}
          >
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    // No specific styles needed here, just a container for positioning
  },
  countContainer: {
    borderRadius: 9999, // rounded-full
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  countText: {
    fontWeight: '500',
  },
});

export default AvatarGroup;
