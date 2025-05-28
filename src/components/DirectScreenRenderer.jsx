import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import {
  getCurrentScreen,
  subscribeToScreenChanges,
  SCREENS
} from '../utils/globalScreenManager';

// Import screens
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import PasswordCreationScreen from '../screens/auth/PasswordCreationScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import GroupsScreen from '../screens/groups/GroupsScreen';

const DirectScreenRenderer = () => {
  const { colors: themeColors } = useTheme();
  const [currentScreen, setCurrentScreen] = useState(null);
  const [screenParams, setScreenParams] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and subscribe to screen changes
  useEffect(() => {
    console.log('DirectScreenRenderer: Initializing');

    // Get the current screen
    const { screen, params } = getCurrentScreen();
    setCurrentScreen(screen);
    setScreenParams(params);
    setIsLoading(false);

    // Subscribe to screen changes
    const subscription = subscribeToScreenChanges(({ screen, params }) => {
      console.log(`DirectScreenRenderer: Screen changed to ${screen}`, params);
      setCurrentScreen(screen);
      setScreenParams(params);
    });

    return () => {
      // Unsubscribe when component unmounts
      subscription.unsubscribe();
    };
  }, []);

  // Create a mock navigation object
  const createMockNavigation = () => {
    return {
      navigate: () => {
        console.log('DirectScreenRenderer: navigate called - this is a mock function');
      },
      goBack: () => {
        console.log('DirectScreenRenderer: goBack called - this is a mock function');
      },
      reset: () => {
        console.log('DirectScreenRenderer: reset called - this is a mock function');
      },
      replace: () => {
        console.log('DirectScreenRenderer: replace called - this is a mock function');
      },
      dispatch: () => {
        console.log('DirectScreenRenderer: dispatch called - this is a mock function');
      },
      addListener: () => {
        console.log('DirectScreenRenderer: addListener called - this is a mock function');
        return () => {};
      },
      getState: () => {
        console.log('DirectScreenRenderer: getState called - this is a mock function');
        return { routes: [] };
      },
      isFocused: () => {
        console.log('DirectScreenRenderer: isFocused called - this is a mock function');
        return true;
      },
      setParams: () => {
        console.log('DirectScreenRenderer: setParams called - this is a mock function');
      }
    };
  };

  // Create a mock route object
  const createMockRoute = (params) => {
    return {
      params: params || {},
      key: 'mock-key',
      name: currentScreen
    };
  };

  // Render the current screen
  const renderScreen = () => {
    console.log(`DirectScreenRenderer: Rendering screen ${currentScreen}`, screenParams);

    const mockNavigation = createMockNavigation();
    const mockRoute = createMockRoute(screenParams);

    switch (currentScreen) {
      case SCREENS.LOGIN:
        return <PhoneLoginScreen navigation={mockNavigation} route={mockRoute} />;

      case SCREENS.OTP_VERIFICATION:
        return <OTPVerificationScreen navigation={mockNavigation} route={mockRoute} />;

      case SCREENS.PASSWORD_CREATION:
        return <PasswordCreationScreen navigation={mockNavigation} route={mockRoute} />;

      case SCREENS.PROFILE_SETUP:
        return <ProfileSetupScreen navigation={mockNavigation} route={mockRoute} />;

      case SCREENS.MAIN:
        return <GroupsScreen navigation={mockNavigation} route={mockRoute} />;

      default:
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
            <Text style={{ color: themeColors.text, fontSize: 16, marginBottom: 20 }}>
              Unknown screen: {currentScreen}
            </Text>
          </View>
        );
    }
  };

  // Show loading indicator while initializing
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
        <ActivityIndicator size="large" color={themeColors.primary.default} />
        <Text style={{ color: themeColors.text, fontSize: 16, marginTop: 20 }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {renderScreen()}
    </View>
  );
};

export default DirectScreenRenderer;
