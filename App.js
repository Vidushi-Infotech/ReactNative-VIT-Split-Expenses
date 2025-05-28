/**
 * VitSplit - Expense Splitting App
 *
 * @format
 */

import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, View, Alert, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Navigation from './src/navigation/index.jsx';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import PermissionsManager from './src/components/common/PermissionsManager';
import { initAuthStateListener } from './src/utils/authStateListener';
import { clearForceNavigateToMainFlag } from './src/utils/navigationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isForceNavigationToMainEnabled, clearForceNavigationFlag } from './src/utils/forceNavigation';
import { isDirectNavigationToMainEnabled, clearDirectNavigationFlag } from './src/utils/directNavigation';
import {
  isForceNavigationEnabled,
  getForceNavigationDetails,
  clearForceNavigation
} from './src/utils/registrationNavigation';

// StatusBar component that uses the theme context
const ThemedStatusBar = () => {
  const { isDarkMode, colors } = useTheme();
  return (
    <StatusBar
      barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      backgroundColor={isDarkMode ? colors.dark.default : colors.white}
    />
  );
};

function AppContent({ navigationRef }) {
  const [key, setKey] = useState(0);
  const [shouldNavigateToMain, setShouldNavigateToMain] = useState(false);
  const [forceNavigation, setForceNavigation] = useState({
    enabled: false,
    screen: null,
    params: {}
  });

  // Log when the component mounts with the navigationRef
  useEffect(() => {
    console.log('AppContent: Mounted with navigationRef:', navigationRef.current ? 'available' : 'not available');
  }, []);

  // Check for registration force navigation
  useEffect(() => {
    const checkRegistrationNavigation = async () => {
      try {
        console.log('AppContent: Checking registration force navigation');

        // Check if force navigation is enabled
        const isEnabled = await isForceNavigationEnabled();

        if (isEnabled) {
          console.log('AppContent: Registration force navigation is enabled');

          // Get the navigation details
          const { screen, params } = await getForceNavigationDetails();

          if (screen) {
            console.log(`AppContent: Force navigation to ${screen} with params:`, params);

            // Set state to trigger navigation in the next effect
            setForceNavigation({
              enabled: true,
              screen,
              params
            });

            // Clear the force navigation flags
            await clearForceNavigation();
          }
        }
      } catch (error) {
        console.error('AppContent: Error checking registration force navigation:', error);
      }
    };

    // Check on mount and when key changes
    checkRegistrationNavigation();
  }, [key]);

  // Check for the force navigation flag
  useEffect(() => {
    const checkForceNavigationFlag = async () => {
      try {
        // Check if force navigation to Main is enabled
        const isEnabled = await isForceNavigationToMainEnabled();

        // Also check for FORCE_NAVIGATE_TO_GROUPS flag
        const forceNavigateToGroups = await AsyncStorage.getItem('FORCE_NAVIGATE_TO_GROUPS');

        // Check for FORCE_RELOAD flag
        const forceReload = await AsyncStorage.getItem('FORCE_RELOAD');

        if (isEnabled || forceNavigateToGroups || forceReload) {
          console.log('AppContent: Force navigation is enabled');
          console.log('FORCE_NAVIGATE_TO_MAIN:', isEnabled);
          console.log('FORCE_NAVIGATE_TO_GROUPS:', forceNavigateToGroups);
          console.log('FORCE_RELOAD:', forceReload);

          // Get the user profile from AsyncStorage
          const userProfileData = await AsyncStorage.getItem('userProfile');

          if (userProfileData) {
            const userProfile = JSON.parse(userProfileData);
            console.log('AppContent: User profile found in AsyncStorage');

            // Set a flag to indicate that the user is authenticated
            await AsyncStorage.setItem('isAuthenticated', 'true');
            console.log('AppContent: Set isAuthenticated flag in AsyncStorage');

            // Clear the flags
            await clearForceNavigationFlag();
            await AsyncStorage.removeItem('FORCE_NAVIGATE_TO_GROUPS');
            await AsyncStorage.removeItem('FORCE_RELOAD');

            // Set state to trigger navigation in the next effect
            setShouldNavigateToMain(true);

            // CRITICAL FIX: Wait for navigationRef to be available
            if (navigationRef.current) {
              console.log('AppContent: Navigation ref is available, attempting direct navigation');

              try {
                // SUPER CRITICAL FIX: Force authentication state in memory
                // This ensures the navigation state is correct
                const { setIsAuthenticated, setUserProfile } = require('./src/context/AuthContext').useAuth();
                if (setIsAuthenticated) {
                  setIsAuthenticated(true);
                  console.log('AppContent: Forced authentication state in memory');
                }
                if (setUserProfile && userProfile) {
                  setUserProfile(userProfile);
                  console.log('AppContent: Set user profile in memory');
                }

                // Force a re-render first to ensure the navigation state is updated
                setKey(prevKey => prevKey + 1);

                // Wait a moment for the re-render to complete
                setTimeout(() => {
                  try {
                    // Use resetRoot for most reliable navigation
                    navigationRef.current.resetRoot({
                      index: 0,
                      routes: [{ name: 'Main' }],
                    });
                    console.log('AppContent: Direct navigation to Main successful');
                  } catch (resetError) {
                    console.error('AppContent: Error with resetRoot navigation:', resetError);

                    // Try alternative approach
                    try {
                      console.log('AppContent: Trying alternative navigation approach');
                      navigationRef.current.navigate('Main');
                    } catch (navError) {
                      console.error('AppContent: Error with navigate:', navError);

                      // Try one more approach
                      try {
                        console.log('AppContent: Trying CommonActions.reset');
                        const { CommonActions } = require('@react-navigation/native');
                        navigationRef.current.dispatch(
                          CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Main' }],
                          })
                        );
                      } catch (dispatchError) {
                        console.error('AppContent: Error with dispatch:', dispatchError);
                      }
                    }
                  }
                }, 100);
              } catch (navError) {
                console.error('AppContent: Error with direct navigation:', navError);
              }
            } else {
              console.log('AppContent: Navigation ref not available yet, will try again later');
              // The setShouldNavigateToMain(true) above will trigger navigation when ref becomes available
            }
          } else {
            console.error('AppContent: No user profile found in AsyncStorage');

            // Clear the flags
            await clearForceNavigationFlag();
            await AsyncStorage.removeItem('FORCE_NAVIGATE_TO_GROUPS');
            await AsyncStorage.removeItem('FORCE_RELOAD');
          }
        }
      } catch (error) {
        console.error('AppContent: Error checking force navigation flag:', error);
      }
    };

    // Check the flag on mount and when key changes
    checkForceNavigationFlag();

    // Check more frequently to ensure navigation happens
    const interval = setInterval(() => {
      // Use a simplified version that doesn't log unless something is found
      const checkQuietly = async () => {
        try {
          // Check if force navigation to Main is enabled
          const isEnabled = await isForceNavigationToMainEnabled();
          const forceNavigateToGroups = await AsyncStorage.getItem('FORCE_NAVIGATE_TO_GROUPS');
          const forceReload = await AsyncStorage.getItem('FORCE_RELOAD');

          // Only proceed with logging if flags are found
          if (isEnabled || forceNavigateToGroups || forceReload) {
            console.log('AppContent: Force navigation flag found, processing...');
            checkForceNavigationFlag();
          }
        } catch (error) {
          // Silent error handling
        }
      };

      checkQuietly();
    }, 500); // Check more frequently

    return () => clearInterval(interval);
  }, [key, navigationRef.current]);

  // Handle navigation when navigationRef is available and shouldNavigateToMain is true
  useEffect(() => {
    if (shouldNavigateToMain && navigationRef.current) {
      console.log('AppContent: Navigation ref is available and shouldNavigateToMain is true');

      // Use setTimeout to ensure the navigation state is ready
      const timer = setTimeout(() => {
        try {
          console.log('AppContent: Attempting to navigate to Main');

          // Use resetRoot to reset the navigation state
          navigationRef.current.resetRoot({
            index: 0,
            routes: [{ name: 'Main' }],
          });

          console.log('AppContent: Navigation to Main successful');

          // Reset the flag
          setShouldNavigateToMain(false);
        } catch (error) {
          console.error('AppContent: Error navigating to Main:', error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [shouldNavigateToMain, navigationRef.current]);

  // Initialize the authentication state listener
  useEffect(() => {
    console.log('AppContent: Initializing authentication state listener');

    // Initialize the authentication state listener
    initAuthStateListener((isAuthenticated) => {
      console.log('AppContent: Authentication state changed:', { isAuthenticated });

      // Force a re-render of the Navigation component
      setKey(prevKey => prevKey + 1);

      // If the user is authenticated, navigate to the Main screen
      if (isAuthenticated && navigationRef.current) {
        console.log('AppContent: User is authenticated, checking if we should navigate to Main');

        // CRITICAL FIX: Check if we should block navigation to Main
        AsyncStorage.getItem('BLOCK_MAIN_NAVIGATION').then(blockMainNavigation => {
          if (blockMainNavigation === 'true') {
            console.log('AppContent: BLOCK_MAIN_NAVIGATION flag is set, skipping navigation to Main');
            return;
          }

          // CRITICAL FIX: Check if user is in registration flow
          AsyncStorage.getItem('isRegistering').then(isRegistering => {
            if (isRegistering === 'true') {
              console.log('AppContent: User is in registration flow, skipping navigation to Main');
              return;
            }

            console.log('AppContent: No blocks found, proceeding with navigation to Main');

            // Use setTimeout to ensure this happens after the component is fully mounted
            setTimeout(() => {
              try {
                console.log('AppContent: Attempting to navigate to Main');
                navigationRef.current.resetRoot({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
                console.log('AppContent: Navigation to Main successful');
              } catch (error) {
                console.error('AppContent: Error navigating to Main:', error);
              }
            }, 500);
          });
        });
      }
    });
  }, []);

  // Handle registration force navigation
  useEffect(() => {
    if (forceNavigation.enabled && navigationRef.current && forceNavigation.screen) {
      console.log(`AppContent: Force navigation to ${forceNavigation.screen} is enabled`);

      // Use setTimeout to ensure the navigation state is ready
      const timer = setTimeout(() => {
        try {
          console.log(`AppContent: Attempting to navigate to ${forceNavigation.screen}`);

          // Navigate to the specified screen
          navigationRef.current.navigate(forceNavigation.screen, forceNavigation.params);

          console.log(`AppContent: Navigation to ${forceNavigation.screen} triggered`);

          // Reset the force navigation state
          setForceNavigation({
            enabled: false,
            screen: null,
            params: {}
          });
        } catch (error) {
          console.error(`AppContent: Error navigating to ${forceNavigation.screen}:`, error);

          // Try with reset as a fallback
          try {
            console.log(`AppContent: Attempting to reset navigation to ${forceNavigation.screen}`);

            navigationRef.current.reset({
              index: 0,
              routes: [
                {
                  name: forceNavigation.screen,
                  params: forceNavigation.params
                }
              ]
            });

            console.log(`AppContent: Reset navigation to ${forceNavigation.screen} successful`);

            // Reset the force navigation state
            setForceNavigation({
              enabled: false,
              screen: null,
              params: {}
            });
          } catch (resetError) {
            console.error(`AppContent: Error resetting navigation to ${forceNavigation.screen}:`, resetError);
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [forceNavigation, navigationRef.current]);

  // Log when the component renders
  console.log('AppContent: Rendering with navigationRef:', navigationRef.current ? 'available' : 'not available');

  // CRITICAL FIX: Use the navigationRef directly for navigation
  // instead of relying on the Navigation component to handle it
  return (
    <View style={{ flex: 1 }}>
      <ThemedStatusBar />
      <Navigation
        key={key}
        initialRouteName={shouldNavigateToMain ? 'Main' : undefined}
        navigationRef={navigationRef}
      />
    </View>
  );
}

function App() {
  // Create a navigation ref at the App level
  const navigationRef = useRef(null);
  const [currentRouteName, setCurrentRouteName] = useState(null);

  // CRITICAL FIX: Check for navigation flags and handle them properly
  useEffect(() => {
    if (!navigationRef.current) return;

    // Store previous values to detect changes
    let prevFlags = {
      forceNavigateToMain: null,
      forceNavigateToGroups: null,
      forceNavigateToMainLowercase: null,
      isAuthenticated: null,
      forceReload: null,
      isRegistering: null,
      currentRegistrationStep: null
    };

    const checkNavigationFlags = async () => {
      try {
        // Check for ALL possible force navigation flags
        const forceNavigateToMain = await AsyncStorage.getItem('FORCE_NAVIGATE_TO_MAIN');
        const forceNavigateToGroups = await AsyncStorage.getItem('FORCE_NAVIGATE_TO_GROUPS');
        const forceNavigateToMainLowercase = await AsyncStorage.getItem('forceNavigateToMain');
        const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
        const forceReload = await AsyncStorage.getItem('FORCE_RELOAD');
        const isRegistering = await AsyncStorage.getItem('isRegistering');
        const currentRegistrationStep = await AsyncStorage.getItem('currentRegistrationStep');

        // Create current flags object
        const currentFlags = {
          forceNavigateToMain,
          forceNavigateToGroups,
          forceNavigateToMainLowercase,
          isAuthenticated,
          forceReload,
          isRegistering,
          currentRegistrationStep
        };

        // Only log if there's a change in any flag
        const hasChanged =
          prevFlags.forceNavigateToMain !== currentFlags.forceNavigateToMain ||
          prevFlags.forceNavigateToGroups !== currentFlags.forceNavigateToGroups ||
          prevFlags.forceNavigateToMainLowercase !== currentFlags.forceNavigateToMainLowercase ||
          prevFlags.isAuthenticated !== currentFlags.isAuthenticated ||
          prevFlags.forceReload !== currentFlags.forceReload ||
          prevFlags.isRegistering !== currentFlags.isRegistering ||
          prevFlags.currentRegistrationStep !== currentFlags.currentRegistrationStep;

        // Update previous flags
        prevFlags = { ...currentFlags };

        // Only log if there's a change
        if (hasChanged) {
          console.log('Navigation flags changed:', currentFlags);
        }

        // CRITICAL FIX: Don't interfere with registration flow
        if (isRegistering === 'true') {
          console.log(`User is in registration flow${currentRegistrationStep ? ` at step: ${currentRegistrationStep}` : ''}, skipping force navigation`);
          return;
        }

        // Also check for specific navigation flags that indicate we're in the middle of a flow
        const navigatingToPasswordCreation = await AsyncStorage.getItem('navigatingToPasswordCreation');
        if (navigatingToPasswordCreation === 'true') {
          console.log('User is navigating to password creation, skipping force navigation');
          return;
        }

        // CRITICAL FIX: Check for explicit block on main navigation
        const blockMainNavigation = await AsyncStorage.getItem('BLOCK_MAIN_NAVIGATION');
        if (blockMainNavigation === 'true') {
          console.log('BLOCK_MAIN_NAVIGATION flag is set, skipping force navigation');
          return;
        }

        // Check if any navigation flag is set
        if (forceNavigateToMain === 'true' ||
            forceNavigateToGroups === 'true' ||
            forceNavigateToMainLowercase === 'true') {

          console.log('Force navigation flag found, attempting navigation to Main');

          // Clear ALL flags first to prevent loops
          await AsyncStorage.removeItem('FORCE_NAVIGATE_TO_MAIN');
          await AsyncStorage.removeItem('FORCE_NAVIGATE_TO_GROUPS');
          await AsyncStorage.removeItem('forceNavigateToMain');
          await AsyncStorage.removeItem('FORCE_RELOAD');

          // CRITICAL: Check if user is authenticated
          if (isAuthenticated === 'true') {
            console.log('User is authenticated, proceeding with navigation');

            // CRITICAL FIX: Use a timeout to ensure navigation happens after state updates
            setTimeout(() => {
              try {
                // Approach 1: Use resetRoot
                navigationRef.current.resetRoot({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
                console.log('Navigation to Main completed via resetRoot');
                return; // Exit if successful
              } catch (error) {
                console.error('Error using resetRoot:', error);

                // Approach 2: Use dispatch with CommonActions
                try {
                  const { CommonActions } = require('@react-navigation/native');
                  navigationRef.current.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'Main' }]
                    })
                  );
                  console.log('Navigation to Main completed via CommonActions.reset');
                  return; // Exit if successful
                } catch (dispatchError) {
                  console.error('Error using CommonActions.reset:', dispatchError);

                  // Approach 3: Use navigate
                  try {
                    navigationRef.current.navigate('Main');
                    console.log('Navigation to Main completed via navigate');
                  } catch (navError) {
                    console.error('Error using navigate:', navError);
                  }
                }
              }
            }, 500);
          } else {
            console.log('User is not authenticated, not navigating to Main');
          }
        }
      } catch (error) {
        console.error('Error checking navigation flags:', error);
      }
    };

    // Run the check immediately
    checkNavigationFlags();

    // Set up an interval to check periodically (more frequently)
    const interval = setInterval(checkNavigationFlags, 200);

    return () => clearInterval(interval);
  }, [navigationRef.current]);

  // Handle navigation errors
  const handleNavigationStateChange = (state) => {
    // Log the navigation state for debugging
    console.log('Navigation state changed:', state);

    // Track the current route name for use in useEffect
    if (state && state.routes && state.index >= 0) {
      const currentRoute = state.routes[state.index];
      setCurrentRouteName(currentRoute?.name);
      console.log('Current route:', currentRoute?.name);
    }
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              console.log('NavigationContainer is ready, navigationRef is now available');
            }}
            onStateChange={handleNavigationStateChange}
          >
            <NotificationProvider>
              <PermissionsManager>
                <AppContent navigationRef={navigationRef} />
              </PermissionsManager>
            </NotificationProvider>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
