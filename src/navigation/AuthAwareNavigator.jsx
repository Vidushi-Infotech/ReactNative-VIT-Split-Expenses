import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navigation from './index';

const AuthAwareNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors: themeColors } = useTheme();
  const [key, setKey] = useState(0);

  // Force re-render when authentication state changes
  useEffect(() => {
    console.log('AuthAwareNavigator: Authentication state changed, isAuthenticated =', isAuthenticated);
    // Increment the key to force a re-render of the Navigation component
    setKey(prevKey => prevKey + 1);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: themeColors.background
      }}>
        <ActivityIndicator size="large" color={themeColors.primary.default} />
        <Text style={{ 
          marginTop: 20, 
          color: themeColors.text,
          fontSize: 16
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Use the key to force a re-render when authentication state changes
  return <Navigation key={key} />;
};

export default AuthAwareNavigator;
