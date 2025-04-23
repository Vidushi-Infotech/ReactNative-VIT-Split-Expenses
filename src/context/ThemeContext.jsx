import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '../theme/theme';

const ThemeContext = createContext({
  displayMode: 'system',
  colorTheme: 'blue',
  isDarkMode: false,
  colors: {},
  setDisplayMode: () => {},
  setColorTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Display mode (light, dark, system)
  const [displayMode, setDisplayModeState] = useState('system');
  // Color theme (blue, green, yellow, orange)
  const [colorTheme, setColorThemeState] = useState('blue');

  const systemColorScheme = useColorScheme() || 'light';
  const isDarkMode = displayMode === 'system' ? systemColorScheme === 'dark' : displayMode === 'dark';

  // Get the current theme colors based on color theme and dark mode
  const colors = useMemo(() => {
    return getThemeColors(colorTheme, isDarkMode);
  }, [colorTheme, isDarkMode]);

  useEffect(() => {
    // Load saved theme preferences
    const loadThemePreferences = async () => {
      try {
        const savedDisplayMode = await AsyncStorage.getItem('displayMode');
        const savedColorTheme = await AsyncStorage.getItem('colorTheme');

        if (savedDisplayMode) {
          setDisplayModeState(savedDisplayMode);
        }

        if (savedColorTheme) {
          setColorThemeState(savedColorTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preferences', error);
      }
    };

    loadThemePreferences();
  }, []);

  const setDisplayMode = async (newDisplayMode) => {
    setDisplayModeState(newDisplayMode);
    try {
      await AsyncStorage.setItem('displayMode', newDisplayMode);
    } catch (error) {
      console.error('Failed to save display mode preference', error);
    }
  };

  const setColorTheme = async (newColorTheme) => {
    setColorThemeState(newColorTheme);
    try {
      await AsyncStorage.setItem('colorTheme', newColorTheme);
    } catch (error) {
      console.error('Failed to save color theme preference', error);
    }
  };

  // For backward compatibility
  const setTheme = (newTheme) => {
    setDisplayMode(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        displayMode,
        colorTheme,
        isDarkMode,
        colors,
        setDisplayMode,
        setColorTheme,
        // For backward compatibility
        theme: displayMode,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
