import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

/**
 * A screen that automatically navigates to the Main screen
 * This is used as a workaround for navigation issues
 */
const AutoNavigateScreen = () => {
  const navigation = useNavigation();
  const { colors: themeColors } = useTheme();
  const { login } = useAuth();

  useEffect(() => {
    const navigateToMain = async () => {
      try {
        console.log('AutoNavigateScreen: Attempting to navigate to Main');
        
        // Get the user profile from AsyncStorage
        const userProfileData = await AsyncStorage.getItem('userProfile');
        
        if (userProfileData) {
          console.log('AutoNavigateScreen: User profile found in AsyncStorage');
          
          // Parse the user profile
          const userProfile = JSON.parse(userProfileData);
          
          // Set the isAuthenticated flag in AsyncStorage
          await AsyncStorage.setItem('isAuthenticated', 'true');
          
          // Call login with the user profile
          console.log('AutoNavigateScreen: Calling login with user profile');
          await login(userProfile);
          
          // Clear the direct navigation flag
          await AsyncStorage.removeItem('DIRECT_NAVIGATION_TO_MAIN');
          
          // Use CommonActions to reset the navigation state
          console.log('AutoNavigateScreen: Resetting navigation to Main');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
        } else {
          console.error('AutoNavigateScreen: No user profile found in AsyncStorage');
          
          // Navigate to the login screen
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('AutoNavigateScreen: Error navigating to Main:', error);
        
        // Navigate to the login screen as fallback
        navigation.navigate('Login');
      }
    };
    
    // Navigate to Main after a short delay
    const timer = setTimeout(() => {
      navigateToMain();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [navigation]);
  
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.text, { color: themeColors.text }]}>
        Navigating to your account...
      </Text>
      <ActivityIndicator size="large" color={themeColors.primary.default} style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 20,
  },
});

export default AutoNavigateScreen;
