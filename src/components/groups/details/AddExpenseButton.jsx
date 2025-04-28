import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext.jsx';
import Animated from 'react-native-reanimated';
import styles from './GroupDetailsStyles';

const AddExpenseButton = ({ onPress, isVisible = true }) => {
  const { colors: themeColors, isDarkMode } = useTheme();

  if (!isVisible) return null;

  // Create shadow style based on theme
  const buttonShadow = {
    shadowColor: isDarkMode ? '#000' : themeColors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.5 : 0.3,
    shadowRadius: 8,
    elevation: 8,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.addButton}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.addButtonInner,
          {
            backgroundColor: themeColors.primary.default,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)'
          },
          buttonShadow
        ]}
      >
        <Icon
          name="add-outline"
          size={30}
          color={themeColors.white}
          style={styles.addButtonIcon}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AddExpenseButton;
