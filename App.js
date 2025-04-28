/**
 * VitSplit - Expense Splitting App
 *
 * @format
 */

import React from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Navigation from './src/navigation/index.jsx';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import PermissionsManager from './src/components/common/PermissionsManager';

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

function AppContent() {
  return (
    <View style={{ flex: 1 }}>
      <ThemedStatusBar />
      <Navigation />
    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <NotificationProvider>
              <PermissionsManager>
                <AppContent />
              </PermissionsManager>
            </NotificationProvider>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
