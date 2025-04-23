import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
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
  const { isDarkMode } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDarkMode ? '#1A202C' : '#F7FAFC',
        },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator = () => {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#5E72E4',
        tabBarInactiveTintColor: isDarkMode ? '#A0AEC0' : '#718096',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1A202C' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#2D3748' : '#E2E8F0',
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Check if it's the first launch
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
          setIsFirstLaunch(true);
          await AsyncStorage.setItem('hasLaunched', 'true');
        } else {
          setIsFirstLaunch(false);
        }

        // For demo purposes, we'll consider the user as authenticated
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
        setIsAuthenticated(true);
      }
    };

    checkFirstLaunch();
  }, []);

  // Show loading while checking first launch
  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDarkMode ? '#1A202C' : '#F7FAFC',
          },
        }}
      >
        {isFirstLaunch && (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}

        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}

        <Stack.Screen
          name="GroupDetails"
          component={GroupDetailsScreen}
          options={{
            headerShown: false,
            headerTitle: '',
            headerTransparent: false,
            headerTintColor: '#FFFFFF',
          }}
        />

        <Stack.Screen
          name="CreateGroup"
          component={CreateGroupScreen}
          options={{
            headerShown: true,
            headerTitle: 'Create Group',
            headerTintColor: isDarkMode ? '#FFFFFF' : '#1A202C',
            headerStyle: {
              backgroundColor: isDarkMode ? '#1A202C' : '#F7FAFC',
            },
          }}
        />

        <Stack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{
            headerShown: true,
            headerTitle: 'Add Expense',
            headerTintColor: isDarkMode ? '#FFFFFF' : '#1A202C',
            headerStyle: {
              backgroundColor: isDarkMode ? '#1A202C' : '#F7FAFC',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function Navigation() {
  return <AppNavigator />;
}
