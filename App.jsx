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
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import PhoneLoginScreen from './src/screens/PhoneLoginScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import RegisterScreen from './src/screens/RegisterScreen';

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

const HomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Splitzy Home</Text>
    <Text style={{ fontSize: 16, color: '#6C757D' }}>Welcome to your expense tracker!</Text>
  </View>
);

const GroupsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Groups</Text>
    <Text style={{ fontSize: 16, color: '#6C757D' }}>Manage your groups here</Text>
  </View>
);

const AddExpenseScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Add Expense</Text>
    <Text style={{ fontSize: 16, color: '#6C757D' }}>Create a new expense</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Profile</Text>
    <Text style={{ fontSize: 16, color: '#6C757D' }}>Your profile and settings</Text>
  </View>
);

const Tab = createBottomTabNavigator();

// Tab Bar Icon Component
const TabBarIcon = ({ name, focused }) => {
  const getIcon = () => {
    switch (name) {
      case 'Home':
        return focused ? '🏠' : '🏡';
      case 'Groups':
        return focused ? '👥' : '👤';
      case 'Add':
        return '➕';
      case 'Profile':
        return focused ? '👤' : '👤';
      default:
        return '📱';
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24 }}>{getIcon()}</Text>
    </View>
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
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Splitzy',
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          title: 'Groups',
          headerTitle: 'My Groups',
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddExpenseScreen}
        options={{
          title: 'Add',
          headerTitle: 'Add Expense',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
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
