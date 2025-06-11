import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme configurations
export const lightTheme = {
  mode: 'light',
  colors: {
    // Background colors
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    
    // Text colors
    text: '#2D3748',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    
    // Primary colors
    primary: '#4A90E2',
    primaryLight: '#E3F2FD',
    
    // Status colors
    success: '#48BB78',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Border colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    
    // Icon colors
    icon: '#6B7280',
    iconActive: '#4A90E2',
    
    // Status bar
    statusBarStyle: 'dark-content',
    statusBarBackground: '#FFFFFF',
  },
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    // Background colors
    background: '#1A202C',
    surface: '#2D3748',
    card: '#2D3748',
    
    // Text colors
    text: '#F7FAFC',
    textSecondary: '#CBD5E0',
    textMuted: '#A0AEC0',
    
    // Primary colors
    primary: '#63B3ED',
    primaryLight: '#2A4A6B',
    
    // Status colors
    success: '#68D391',
    error: '#FC8181',
    warning: '#F6AD55',
    info: '#63B3ED',
    
    // Border colors
    border: '#4A5568',
    borderLight: '#2D3748',
    
    // Icon colors
    icon: '#CBD5E0',
    iconActive: '#63B3ED',
    
    // Status bar
    statusBarStyle: 'light-content',
    statusBarBackground: '#1A202C',
  },
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme() || 'light');
  const [isLoading, setIsLoading] = useState(true);

  // Get the current active theme
  const getCurrentTheme = () => {
    if (themeMode === 'system') {
      return systemTheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const currentTheme = getCurrentTheme();

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        console.log('🎨 Loading theme preference...');
        const savedTheme = await AsyncStorage.getItem('themeMode');
        console.log('🎨 Saved theme from storage:', savedTheme);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeMode(savedTheme);
          console.log('🎨 Theme mode set to:', savedTheme);
        } else {
          console.log('🎨 No saved theme, using default: system');
        }
      } catch (error) {
        console.error('❌ Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
        console.log('🎨 Theme loading complete');
      }
    };

    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme || 'light');
    });

    return () => subscription?.remove();
  }, []);

  // Update status bar when theme changes
  useEffect(() => {
    StatusBar.setBarStyle(currentTheme.colors.statusBarStyle);
    StatusBar.setBackgroundColor(currentTheme.colors.statusBarBackground);
  }, [currentTheme]);

  // Save theme preference
  const saveThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Change theme mode
  const setTheme = (mode) => {
    console.log('🎨 Setting theme to:', mode);
    if (['light', 'dark', 'system'].includes(mode)) {
      setThemeMode(mode);
      saveThemePreference(mode);
      console.log('🎨 Theme changed successfully to:', mode);
    } else {
      console.error('❌ Invalid theme mode:', mode);
    }
  };

  // Get theme display name
  const getThemeDisplayName = (mode) => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  // Get theme icon
  const getThemeIcon = (mode) => {
    switch (mode) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      case 'system':
        return 'phone-portrait';
      default:
        return 'phone-portrait';
    }
  };

  const value = {
    theme: currentTheme,
    themeMode,
    systemTheme,
    isLoading,
    setTheme,
    getThemeDisplayName,
    getThemeIcon,
    isDark: currentTheme.mode === 'dark',
    isLight: currentTheme.mode === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
