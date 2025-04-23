import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

/**
 * A wrapper component that handles safe area insets for different devices
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.style - Additional styles for the container
 * @param {boolean} props.topSafeArea - Whether to apply top safe area inset (default: true)
 * @param {boolean} props.bottomSafeArea - Whether to apply bottom safe area inset (default: true)
 * @param {boolean} props.edges - Edges to apply safe area to (default: ['top', 'bottom'])
 * @returns {React.ReactNode}
 */
const SafeAreaWrapper = ({
  children,
  style,
  topSafeArea = true,
  bottomSafeArea = true,
}) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors: themeColors } = useTheme();

  // Calculate padding based on safe area insets
  const safeAreaStyle = {
    paddingTop: topSafeArea ? insets.top : 0,
    paddingBottom: bottomSafeArea ? insets.bottom : 0,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    backgroundColor: isDarkMode ? themeColors.background : themeColors.background,
  };

  return (
    <View style={[styles.container, safeAreaStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaWrapper;
