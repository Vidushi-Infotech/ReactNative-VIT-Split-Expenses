import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext.jsx';
import styles from './GroupDetailsStyles';

const ErrorState = ({ message = 'Group not found' }) => {
  const { colors: themeColors } = useTheme();
  
  return (
    <View style={styles.centerContainer}>
      <Icon name="alert-circle-outline" size={60} color={themeColors.danger} />
      <Text style={[styles.text, { color: themeColors.text, marginTop: 16 }]}>
        {message}
      </Text>
    </View>
  );
};

export default ErrorState;
