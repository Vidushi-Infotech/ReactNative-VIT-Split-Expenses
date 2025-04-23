import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, fontSizes } from '../../theme/theme';

const Avatar = ({
  source,
  name,
  size = 'md',
  showBorder = false,
}) => {
  // Get size dimensions
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 32; // 8 * 4
      case 'md':
        return 48; // 12 * 4
      case 'lg':
        return 64; // 16 * 4
      case 'xl':
        return 96; // 24 * 4
      default:
        return 48;
    }
  };

  // Get font size based on avatar size
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return fontSizes.xs;
      case 'md':
        return fontSizes.base;
      case 'lg':
        return fontSizes.lg;
      case 'xl':
        return fontSizes.xxl;
      default:
        return fontSizes.base;
    }
  };

  // Get initials from name
  const getInitials = () => {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Get border styles
  const getBorderStyles = () => {
    return showBorder ? {
      borderWidth: 2,
      borderColor: colors.white,
    } : {};
  };

  const sizeValue = getSize();

  const containerStyles = [
    styles.container,
    {
      width: sizeValue,
      height: sizeValue,
      backgroundColor: source ? 'transparent' : colors.primary.default,
      ...getBorderStyles(),
    },
  ];

  const textStyles = [
    styles.text,
    {
      fontSize: getFontSize(),
    },
  ];

  return (
    <View style={containerStyles}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Text style={textStyles}>
          {getInitials()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999, // rounded-full
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default Avatar;
