import React, { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import GroupsScreen from '../screens/groups/GroupsScreen';
import GroupDetailsScreen from '../screens/groups/GroupDetailsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

// Create navigators
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => {
  const { isDarkMode, colors: themeColors } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDarkMode ? themeColors.dark.default : themeColors.light.default,
        },
      }}
    >
      <AuthStack.Screen name="Login" component={PhoneLoginScreen} />
      <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </AuthStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator = () => {
  const { isDarkMode, colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: themeColors.primary.default,
        tabBarInactiveTintColor: isDarkMode ? themeColors.gray[500] : themeColors.gray[600],
        tabBarStyle: {
          backgroundColor: isDarkMode ? themeColors.dark.default : themeColors.white,
          borderTopColor: isDarkMode ? themeColors.dark.light : themeColors.gray[300],
          paddingBottom: Math.max(5, insets.bottom),
          paddingTop: 5,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 5 : 0),
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Groups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const { isAuthenticated, isLoading } = useAuth();
  const { isDarkMode, colors: themeColors } = useTheme();

  useEffect(() => {
    // Check if it's the first launch
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
          // This is the first launch, show onboarding
          setIsFirstLaunch(true);
          // Don't set hasLaunched to true here - let the onboarding screens do it
        } else {
          // Not the first launch, skip onboarding
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
      }
    };

    checkFirstLaunch();

    // Add a listener for AsyncStorage changes
    const handleAppStateChange = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched !== null) {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking launch status:', error);
      }
    };

    // Listen for app state changes (foreground, background, etc.)
    AppState.addEventListener('change', handleAppStateChange);

    // Check for hasLaunched changes every 500ms
    // This is a workaround to detect AsyncStorage changes
    const interval = setInterval(checkFirstLaunch, 500);

    // Clean up the listener and interval when the component unmounts
    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
      clearInterval(interval);
    };
  }, []);

  // Show loading while checking first launch or auth status
  if (isFirstLaunch === null || isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDarkMode ? themeColors.dark.default : themeColors.light.default,
          },
        }}
      >
        {isFirstLaunch ? (
          // Onboarding Screen
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          // Auth Navigator
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // Main App Navigator
          <Stack.Screen name="Main" component={MainNavigator} />
        )}

        {/* These screens are accessible from the main navigator */}
        {!isFirstLaunch && isAuthenticated && (
          <>
            <Stack.Screen
              name="GroupDetails"
              component={GroupDetailsScreen}
              options={{
                headerShown: false,
                headerTitle: '',
                headerTransparent: false,
                headerTintColor: themeColors.white,
              }}
            />
            <Stack.Screen
              name="CreateGroup"
              component={CreateGroupScreen}
              options={{
                headerShown: true,
                headerTitle: 'Create Group',
                headerTintColor: isDarkMode ? themeColors.white : themeColors.dark.default,
                headerStyle: {
                  backgroundColor: isDarkMode ? themeColors.dark.default : themeColors.light.default,
                },
              }}
            />
            <Stack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{
                headerShown: false,
                headerTintColor: isDarkMode ? themeColors.white : themeColors.dark.default,
                headerStyle: {
                  backgroundColor: isDarkMode ? themeColors.dark.default : themeColors.light.default,
                },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function Navigation() {
  return <AppNavigator />;
}
