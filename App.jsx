/**
 * Splitzy - Expense Splitting App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import PhoneLoginScreen from './src/screens/PhoneLoginScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import CreateNewPasswordScreen from './src/screens/CreateNewPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import ManageGroupScreen from './src/screens/ManageGroupScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';

// Simple placeholder screens to test navigation
const OnboardingScreen = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
    <Text style={{ fontSize: 32, marginBottom: 20 }}>🎉</Text>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Welcome to Splitzy!</Text>
    <Text style={{ fontSize: 16, color: '#6C757D', marginBottom: 30, textAlign: 'center', paddingHorizontal: 40 }}>
      Split expenses easily with friends and family
    </Text>
    <TouchableOpacity
      style={{ backgroundColor: '#6C63FF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
      onPress={() => navigation.replace('Main')}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '500' }}>Get Started</Text>
    </TouchableOpacity>
  </View>
);

const GroupsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Groups</Text>
    <Text style={{ fontSize: 16, color: '#6C757D' }}>Manage your groups here</Text>
  </View>
);



const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Bar Icon Component
const TabBarIcon = ({ name, focused }) => {
  const getIconComponent = () => {
    switch (name) {
      case 'Home':
        return (
          <MaterialIcons
            name="groups"
            size={24}
            color={focused ? '#6C63FF' : '#ADB5BD'}
          />
        );
      case 'Activity':
        return (
          <Ionicons
            name={focused ? 'notifications' : 'notifications-outline'}
            size={24}
            color={focused ? '#6C63FF' : '#ADB5BD'}
          />
        );
      case 'Profile':
        return (
          <Ionicons
            name={focused ? 'person' : 'person-outline'}
            size={24}
            color={focused ? '#6C63FF' : '#ADB5BD'}
          />
        );
      default:
        return (
          <MaterialIcons
            name="smartphone"
            size={24}
            color={focused ? '#6C63FF' : '#ADB5BD'}
          />
        );
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {getIconComponent()}
    </View>
  );
};

// Home Stack Navigator Component
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="ManageGroup" component={ManageGroupScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator Component
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabBarIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#ADB5BD',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9ECEF',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomColor: '#E9ECEF',
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#212529',
        },
        headerTintColor: '#6C63FF',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          title: 'My Groups',
          headerShown: false, // We'll use custom header in HomeScreen
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          title: 'Activity',
          headerTitle: 'Activity',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showCreateNewPassword, setShowCreateNewPassword] = useState(false);
  const [phoneData, setPhoneData] = useState({ phoneNumber: '', countryCode: '+91' });

  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Show splash screen first
  if (showSplash) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />
        <SplashScreen />
      </>
    );
  }

  // Show OTP verification screen
  if (showOTPVerification) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />
        <OTPVerificationScreen
          navigation={{
            replace: (screenName) => {
              if (screenName === 'Main') {
                setShowLogin(false);
                setShowPhoneLogin(false);
                setShowOTPVerification(false);
              }
            },
            navigate: (screenName) => {
              if (screenName === 'CreateNewPassword') {
                setShowOTPVerification(false);
                setShowCreateNewPassword(true);
              }
            },
            goBack: () => {
              setShowOTPVerification(false);
            },
          }}
          route={{
            params: phoneData
          }}
        />
      </>
    );
  }

  // Show phone login screen
  if (showPhoneLogin) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />
        <PhoneLoginScreen
          navigation={{
            replace: (screenName) => {
              if (screenName === 'Main') {
                setShowLogin(false);
                setShowPhoneLogin(false);
              }
            },
            navigate: (screenName, params) => {
              if (screenName === 'OTPVerification') {
                setPhoneData(params);
                setShowOTPVerification(true);
              }
            },
            goBack: () => {
              setShowPhoneLogin(false);
            },
          }}
        />
      </>
    );
  }

  // Show register screen
  if (showRegister) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />
        <RegisterScreen
          navigation={{
            replace: (screenName) => {
              if (screenName === 'Main') {
                setShowLogin(false);
                setShowRegister(false);
              }
            },
            goBack: () => {
              setShowRegister(false);
            },
          }}
        />
      </>
    );
  }

  // Show create new password screen
  if (showCreateNewPassword) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />
        <CreateNewPasswordScreen
          navigation={{
            replace: (screenName) => {
              if (screenName === 'Login') {
                setShowCreateNewPassword(false);
                setShowLogin(true);
              }
            },
            goBack: () => {
              setShowCreateNewPassword(false);
              setShowOTPVerification(true);
            },
          }}
        />
      </>
    );
  }

  // Show forgot password screen
  if (showForgotPassword) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />
        <ForgotPasswordScreen
          navigation={{
            navigate: (screenName, params) => {
              if (screenName === 'OTPVerification') {
                setPhoneData(params);
                setShowOTPVerification(true);
                setShowForgotPassword(false);
              }
            },
            goBack: () => {
              setShowForgotPassword(false);
            },
          }}
        />
      </>
    );
  }

  // Show login screen after splash
  if (showLogin) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />
        <LoginScreen
          navigation={{
            replace: (screenName) => {
              if (screenName === 'Main') {
                setShowLogin(false);
              }
            },
            navigate: (screenName) => {
              if (screenName === 'PhoneLogin') {
                setShowPhoneLogin(true);
              } else if (screenName === 'Register') {
                setShowRegister(true);
              } else if (screenName === 'ForgotPassword') {
                setShowForgotPassword(true);
              }
            },
          }}
        />
      </>
    );
  }

  // Show main app after login
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />
      <NavigationContainer>
        <MainTabNavigator />
      </NavigationContainer>
    </>
  );
}

export default App;
