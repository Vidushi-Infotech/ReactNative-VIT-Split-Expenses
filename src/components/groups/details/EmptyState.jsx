import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext.jsx';
import Animated, { FadeInDown } from 'react-native-reanimated';
import styles from './GroupDetailsStyles';

const EmptyState = ({
  icon = 'receipt-outline',
  title = 'No Data',
  description = 'No data available.',
  buttonText,
  onButtonPress,
}) => {
  const { colors: themeColors } = useTheme();
  
  return (
    <Animated.View
      style={styles.emptyStateContainer}
      entering={FadeInDown.duration(600)}
    >
      <Icon
        name={icon}
        size={70}
        color={themeColors.textSecondary}
        style={styles.emptyStateIcon}
      />
      <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
        {title}
      </Text>
      <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
        {description}
      </Text>
      
      {buttonText && onButtonPress && (
        <TouchableOpacity
          style={[styles.emptyStateButton, { backgroundColor: themeColors.primary.default }]}
          onPress={onButtonPress}
        >
          <Icon name="add" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.emptyStateButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default EmptyState;
