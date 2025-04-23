// Theme configuration for the app
// This replaces the Tailwind CSS configuration

// Color theme palettes
const colorThemes = {
  blue: {
    primary: {
      default: '#5E72E4',
      light: '#7B8FF7',
      dark: '#324BD9',
    },
    secondary: {
      default: '#F7FAFC',
      dark: '#1A202C',
    },
    success: '#2DCE89',
    info: '#11CDEF',
    warning: '#FB6340',
    danger: '#F5365C',
  },
  green: {
    primary: {
      default: '#2DCE89',
      light: '#4FE3A3',
      dark: '#1FA06A',
    },
    secondary: {
      default: '#F7FAFC',
      dark: '#1A202C',
    },
    success: '#2DCE89',
    info: '#11CDEF',
    warning: '#FB6340',
    danger: '#F5365C',
  },
  yellow: {
    primary: {
      default: '#FFD600',
      light: '#FFEB3B',
      dark: '#FFC107',
    },
    secondary: {
      default: '#F7FAFC',
      dark: '#1A202C',
    },
    success: '#2DCE89',
    info: '#11CDEF',
    warning: '#FB6340',
    danger: '#F5365C',
  },
  orange: {
    primary: {
      default: '#FB6340',
      light: '#FF8A65',
      dark: '#E64A19',
    },
    secondary: {
      default: '#F7FAFC',
      dark: '#1A202C',
    },
    success: '#2DCE89',
    info: '#11CDEF',
    warning: '#FB6340',
    danger: '#F5365C',
  },
};

// Common colors for all themes
const commonColors = {
  dark: {
    default: '#1A202C',
    light: '#2D3748',
  },
  light: {
    default: '#F7FAFC',
    dark: '#E2E8F0',
  },
  gray: {
    100: '#F7FAFC',
    200: '#EDF2F7',
    300: '#E2E8F0',
    400: '#CBD5E0',
    500: '#A0AEC0',
    600: '#718096',
    700: '#4A5568',
    800: '#2D3748',
    900: '#1A202C',
  },
  white: '#FFFFFF',
  black: '#000000',
};

// Function to get the current theme colors
export const getThemeColors = (colorTheme = 'blue', isDarkMode = false) => {
  const themeColors = colorThemes[colorTheme] || colorThemes.blue;

  return {
    ...themeColors,
    ...commonColors,
    background: isDarkMode ? commonColors.dark.default : commonColors.light.default,
    surface: isDarkMode ? commonColors.dark.light : commonColors.white,
    text: isDarkMode ? commonColors.light.default : commonColors.dark.default,
    textSecondary: isDarkMode ? commonColors.gray[400] : commonColors.gray[600],
    border: isDarkMode ? commonColors.gray[700] : commonColors.gray[300],
  };
};

// Default colors (for backward compatibility)
export const colors = {
  ...colorThemes.blue,
  ...commonColors,
};

export const spacing = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const borderRadius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  xxl: 16,
  full: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Helper function to get color with opacity
export const getColorWithOpacity = (color, opacity) => {
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// Available color themes
export const availableColorThemes = [
  { id: 'blue', name: 'Blue' },
  { id: 'green', name: 'Green' },
  { id: 'yellow', name: 'Yellow' },
  { id: 'orange', name: 'Orange' },
];

// Available display modes
export const availableDisplayModes = [
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'system', name: 'System' },
];
