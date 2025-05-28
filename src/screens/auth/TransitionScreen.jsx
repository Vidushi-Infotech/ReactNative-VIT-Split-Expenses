import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

/**
 * A screen that handles transitions between authentication screens
 * This is used to avoid navigation issues when moving between screens
 */
const TransitionScreen = ({ navigation, route }) => {
  const { colors: themeColors } = useTheme();
  const { targetScreen, params = {}, message = 'Please wait...' } = route.params || {};

  const { login } = useAuth();
  const [error, setError] = useState(null);

  // Log the navigation state
  console.log('TransitionScreen: Current navigation state:', navigation.getState());
  console.log('TransitionScreen: Target screen:', targetScreen);
  console.log('TransitionScreen: Params:', params);

  useEffect(() => {
    const navigateToTarget = async () => {
      try {
        console.log(`TransitionScreen: Preparing to navigate to ${targetScreen}`);
        console.log('TransitionScreen: Params:', params);

        if (!targetScreen) {
          console.error('TransitionScreen: No target screen specified');
          setError('Navigation error: No target screen specified');
          return;
        }

        // Set flags in AsyncStorage based on target screen
        if (targetScreen === 'PasswordCreationScreen') {
          await AsyncStorage.setItem('navigatingToPasswordCreation', 'true');
          await AsyncStorage.setItem('isRegistering', 'true');
          await AsyncStorage.removeItem('isAuthenticated');
          console.log('TransitionScreen: Set registration flags for password creation');
        } else if (targetScreen === 'ProfileSetup') {
          await AsyncStorage.setItem('isRegistering', 'true');
          await AsyncStorage.removeItem('navigatingToPasswordCreation');
          await AsyncStorage.removeItem('isAuthenticated');
          console.log('TransitionScreen: Set registration flags for profile setup');
        }

        // Wait a moment to ensure the screen is fully mounted
        await new Promise(resolve => setTimeout(resolve, 1500));

        // CRITICAL FIX: Use a more direct approach for navigation
        console.log(`TransitionScreen: Attempting to navigate to ${targetScreen} with multiple methods`);

        // Try multiple navigation approaches
        try {
          // First try with reset
          console.log('TransitionScreen: Attempting navigation with reset');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: targetScreen,
                  params
                }
              ],
            })
          );
          console.log(`TransitionScreen: Reset navigation to ${targetScreen} triggered`);
        } catch (resetError) {
          console.error('TransitionScreen: Reset navigation failed:', resetError);

          // Try with replace
          try {
            console.log('TransitionScreen: Attempting navigation with replace');
            navigation.replace(targetScreen, params);
            console.log(`TransitionScreen: Replace navigation to ${targetScreen} triggered`);
          } catch (replaceError) {
            console.error('TransitionScreen: Replace navigation failed:', replaceError);

            // Try direct navigation
            try {
              console.log('TransitionScreen: Attempting direct navigation');
              navigation.navigate(targetScreen, params);
              console.log(`TransitionScreen: Direct navigation to ${targetScreen} triggered`);
            } catch (navError) {
              console.error('TransitionScreen: All navigation methods failed:', navError);
              setError(`Unable to navigate to ${targetScreen}. Please restart the app.`);

              // Show alert as last resort
              Alert.alert(
                'Navigation Error',
                `Unable to navigate to the next screen. Please restart the app.`,
                [{ text: 'OK' }]
              );
            }
          }
        }
      } catch (error) {
        console.error('TransitionScreen: Error in navigation:', error);
        setError('An error occurred during navigation. Please restart the app.');
      }
    };

    // Start navigation after a short delay
    const timer = setTimeout(() => {
      navigateToTarget();
    }, 500);

    return () => clearTimeout(timer);
  }, [navigation, targetScreen, params]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.text, { color: themeColors.text }]}>
        {message}
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
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 20,
  },
});

export default TransitionScreen;
