import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, BackHandler, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// COMPLETELY REWRITTEN COMPONENT - EMERGENCY FIX
const NavigateToMainScreen = ({ navigation }) => {
  const { setIsAuthenticated, setUserProfile } = useAuth();
  const { colors: themeColors } = useTheme();

  // Force authentication state on mount
  useEffect(() => {
    console.log('EMERGENCY FIX: NavigateToMainScreen mounted');

    // Set up authentication state
    const setupAuth = async () => {
      try {
        // Set authentication flags
        await AsyncStorage.setItem('isAuthenticated', 'true');
        await AsyncStorage.setItem('FORCE_NAVIGATE_TO_MAIN', 'true');
        await AsyncStorage.setItem('FORCE_NAVIGATE_TO_GROUPS', 'true');
        await AsyncStorage.setItem('FORCE_RELOAD', Date.now().toString());

        // Get user profile
        const userProfileData = await AsyncStorage.getItem('userProfile');
        if (userProfileData) {
          const userProfile = JSON.parse(userProfileData);
          setUserProfile(userProfile);
        }

        // Force authentication state
        setIsAuthenticated(true);

        console.log('EMERGENCY FIX: Authentication state set up');
      } catch (error) {
        console.error('EMERGENCY FIX: Error setting up auth state:', error);
      }
    };

    setupAuth();

    // Prevent going back
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('EMERGENCY FIX: Back button pressed, preventing navigation');
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, []);

  // Direct navigation to Main screen
  const goToMainScreen = () => {
    console.log('EMERGENCY FIX: Manual navigation to Main screen');

    // Try multiple approaches
    try {
      // First try reset
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('EMERGENCY FIX: Error with reset:', error);

      // Try navigate
      try {
        navigation.navigate('Main');
      } catch (navError) {
        console.error('EMERGENCY FIX: Error with navigate:', navError);

        // Show error
        Alert.alert(
          'Navigation Error',
          'Unable to navigate to the Groups screen. Please restart the app.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Direct navigation to Groups screen
  const goToGroupsScreen = () => {
    console.log('EMERGENCY FIX: Manual navigation to Groups screen');

    try {
      // Try to navigate to Groups tab
      navigation.navigate('Main', { screen: 'Groups' });
    } catch (error) {
      console.error('EMERGENCY FIX: Error navigating to Groups tab:', error);

      // Try Main screen as fallback
      goToMainScreen();
    }
  };

  // Restart app
  const restartApp = async () => {
    console.log('EMERGENCY FIX: Restarting app');

    try {
      // Set flags for App.js to handle on next launch
      await AsyncStorage.setItem('isAuthenticated', 'true');
      await AsyncStorage.setItem('FORCE_NAVIGATE_TO_MAIN', 'true');
      await AsyncStorage.setItem('FORCE_NAVIGATE_TO_GROUPS', 'true');
      await AsyncStorage.setItem('FORCE_RELOAD', Date.now().toString());

      // Navigate to Login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('EMERGENCY FIX: Error restarting app:', error);
    }
  };

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.background,
      padding: 20
    }}>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: themeColors.text,
        marginBottom: 20,
        textAlign: 'center'
      }}>
        Navigation to Groups Screen
      </Text>

      <Text style={{
        fontSize: 16,
        color: themeColors.textSecondary,
        marginBottom: 30,
        textAlign: 'center'
      }}>
        Please select one of the options below to navigate to your groups
      </Text>

      <TouchableOpacity
        onPress={goToMainScreen}
        style={{
          backgroundColor: themeColors.primary.default,
          paddingVertical: 15,
          paddingHorizontal: 30,
          borderRadius: 8,
          marginBottom: 15,
          width: '100%',
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
          Go to Main Screen
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={goToGroupsScreen}
        style={{
          backgroundColor: themeColors.secondary.default,
          paddingVertical: 15,
          paddingHorizontal: 30,
          borderRadius: 8,
          marginBottom: 15,
          width: '100%',
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
          Go to Groups Tab
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={restartApp}
        style={{
          backgroundColor: themeColors.danger,
          paddingVertical: 15,
          paddingHorizontal: 30,
          borderRadius: 8,
          width: '100%',
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
          Restart App
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default NavigateToMainScreen;
