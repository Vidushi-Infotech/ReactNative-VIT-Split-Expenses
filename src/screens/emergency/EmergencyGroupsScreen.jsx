import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Alert, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CommonActions } from '@react-navigation/native';
import GroupsScreen from '../groups/GroupsScreen';

// This is an emergency screen that directly renders the GroupsScreen
// while also handling authentication and navigation state
const EmergencyGroupsScreen = ({ navigation }) => {
  const { setIsAuthenticated, setUserProfile } = useAuth();
  const { colors: themeColors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGroups, setShowGroups] = useState(false);

  // Force authentication state on mount
  useEffect(() => {
    console.log('EMERGENCY OVERRIDE: EmergencyGroupsScreen mounted');
    
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
          
          // Ensure profile has a password
          if (!userProfile.password && !userProfile.currentPassword) {
            userProfile.password = 'temp-password-' + Date.now();
            await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
          }
          
          // Set user profile in memory
          setUserProfile(userProfile);
          console.log('EMERGENCY OVERRIDE: User profile set in memory');
        } else {
          // Create a basic profile if none exists
          const basicProfile = {
            id: 'emergency-user',
            phoneNumber: '1234567890',
            countryCode: '+91',
            password: 'emergency-password-' + Date.now(),
            createdAt: new Date().toISOString(),
            verifiedAt: new Date().toISOString()
          };
          
          await AsyncStorage.setItem('userProfile', JSON.stringify(basicProfile));
          setUserProfile(basicProfile);
          console.log('EMERGENCY OVERRIDE: Created basic user profile');
        }
        
        // Force authentication state
        setIsAuthenticated(true);
        console.log('EMERGENCY OVERRIDE: Authentication state forced');
        
        // Show the Groups screen
        setLoading(false);
        setShowGroups(true);
      } catch (error) {
        console.error('EMERGENCY OVERRIDE: Error setting up auth state:', error);
        setError('Failed to set up authentication. Please restart the app.');
        setLoading(false);
      }
    };
    
    setupAuth();
    
    // Prevent going back
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('EMERGENCY OVERRIDE: Back button pressed, preventing navigation');
      return true; // Prevent default behavior
    });
    
    return () => backHandler.remove();
  }, [setIsAuthenticated, setUserProfile]);
  
  // If we're ready to show the Groups screen, render it directly
  if (showGroups) {
    return <GroupsScreen navigation={navigation} />;
  }
  
  // Otherwise show loading or error
  return (
    <View style={styles.container}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={themeColors.primary.default} />
          <Text style={[styles.text, { color: themeColors.text }]}>
            Loading Groups...
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.errorText, { color: themeColors.danger }]}>
            {error || 'Failed to load Groups screen'}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.primary.default }]}
            onPress={() => {
              // Try to navigate to Login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </>
      )}
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
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default EmergencyGroupsScreen;
