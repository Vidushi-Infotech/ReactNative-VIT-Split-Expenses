import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme/theme';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
  ...props
}) => {
  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.light.dark,
        };
      case 'elevated':
        return {
          backgroundColor: colors.white,
          ...shadows.md,
        };
      default:
        return {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.light.dark,
        };
    }
  };

  // Get padding based on size
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: spacing.sm };
      case 'md':
        return { padding: spacing.lg };
      case 'lg':
        return { padding: spacing.xl };
      default:
        return { padding: spacing.lg };
    }
  };

  const cardStyles = [
    styles.card,
    getVariantStyles(),
    getPadding(),
    style,
  ];

  return (
    <TouchableOpacity
      style={cardStyles}
      activeOpacity={props.activeOpacity || (props.onPress ? 0.7 : 1)}
      delayPressIn={0}
      onPress={props.onPress}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});

export default Card;
