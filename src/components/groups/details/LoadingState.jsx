import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../context/ThemeContext.jsx';
import styles from './GroupDetailsStyles';

const LoadingState = ({ message = 'Loading group details...' }) => {
  const { colors: themeColors } = useTheme();
  
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={themeColors.primary.default} />
      <Text style={[styles.text, { color: themeColors.text, marginTop: 16 }]}>
        {message}
      </Text>
    </View>
  );
};

export default LoadingState;
