/**
 * VitSplit - Expense Splitting App
 *
 * @format
 */

import React from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation/index.jsx';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

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
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
