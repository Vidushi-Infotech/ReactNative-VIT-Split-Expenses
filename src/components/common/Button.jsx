import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, fontSizes, spacing, borderRadius } from '../../theme/theme';

const Button = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  // Get button background color based on variant
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary.default;
      case 'secondary':
        return colors.light.dark;
      case 'outline':
        return 'transparent';
      case 'danger':
        return colors.danger;
      default:
        return colors.primary.default;
    }
  };

  // Get text color based on variant
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.white;
      case 'secondary':
        return colors.dark.default;
      case 'outline':
        return colors.primary.default;
      default:
        return colors.white;
    }
  };

  // Get padding based on size
  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: spacing.xs, paddingHorizontal: spacing.md };
      case 'md':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg };
      case 'lg':
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
      default:
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg };
    }
  };

  // Get font size based on button size
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return fontSizes.sm;
      case 'md':
        return fontSizes.base;
      case 'lg':
        return fontSizes.lg;
      default:
        return fontSizes.base;
    }
  };

  // Get border style for outline variant
  const getBorderStyle = () => {
    return variant === 'outline' ? {
      borderWidth: 1,
      borderColor: colors.primary.default,
    } : {};
  };

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: getBackgroundColor(),
      opacity: disabled || loading ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto',
      ...getPadding(),
      ...getBorderStyle(),
    },
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: getTextColor(),
      fontSize: getFontSize(),
    },
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.primary.default : colors.white}
          style={styles.loader}
        />
      ) : null}
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '500',
  },
  loader: {
    marginRight: spacing.sm,
  },
});

export default Button;
