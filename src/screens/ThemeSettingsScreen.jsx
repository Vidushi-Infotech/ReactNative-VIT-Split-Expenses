import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const ThemeSettingsScreen = ({ onClose }) => {
  const { theme, themeMode, setTheme, getThemeDisplayName, getThemeIcon } = useTheme();

  const themeOptions = [
    {
      id: 'light',
      name: 'Light',
      description: 'Light theme with bright colors',
      icon: 'sunny',
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Dark theme with muted colors',
      icon: 'moon',
    },
    {
      id: 'system',
      name: 'System',
      description: 'Follow system appearance setting',
      icon: 'phone-portrait',
    },
  ];

  const handleThemeSelect = (themeId) => {
    setTheme(themeId);
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme.colors.statusBarStyle}
        backgroundColor={theme.colors.statusBarBackground}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theme Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Theme Info */}
        <View style={styles.currentThemeSection}>
          <Text style={styles.sectionTitle}>Current Theme</Text>
          <View style={styles.currentThemeCard}>
            <View style={styles.currentThemeIcon}>
              <Ionicons 
                name={getThemeIcon(themeMode)} 
                size={24} 
                color={theme.colors.primary} 
              />
            </View>
            <View style={styles.currentThemeInfo}>
              <Text style={styles.currentThemeName}>
                {getThemeDisplayName(themeMode)}
              </Text>
              <Text style={styles.currentThemeDescription}>
                {themeMode === 'system' 
                  ? 'Automatically adapts to your device settings'
                  : `Using ${themeMode} theme across the app`
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Theme Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Choose Theme</Text>
          
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.themeOption,
                themeMode === option.id && styles.themeOptionSelected
              ]}
              onPress={() => handleThemeSelect(option.id)}
              activeOpacity={0.7}
            >
              <View style={styles.themeOptionLeft}>
                <View style={[
                  styles.themeOptionIcon,
                  themeMode === option.id && styles.themeOptionIconSelected
                ]}>
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={themeMode === option.id ? theme.colors.primary : theme.colors.icon} 
                  />
                </View>
                <View style={styles.themeOptionInfo}>
                  <Text style={[
                    styles.themeOptionName,
                    themeMode === option.id && styles.themeOptionNameSelected
                  ]}>
                    {option.name}
                  </Text>
                  <Text style={styles.themeOptionDescription}>
                    {option.description}
                  </Text>
                </View>
              </View>
              
              {themeMode === option.id && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewHeaderText}>App Preview</Text>
              <View style={styles.previewHeaderIcon}>
                <Ionicons name="eye" size={16} color={theme.colors.primary} />
              </View>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewText}>
                This is how your app will look with the selected theme.
              </Text>
              <View style={styles.previewButton}>
                <Text style={styles.previewButtonText}>Sample Button</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={theme.colors.info} />
            <Text style={styles.infoText}>
              Theme changes will be applied immediately and saved for future app launches.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  currentThemeSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  currentThemeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currentThemeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currentThemeInfo: {
    flex: 1,
  },
  currentThemeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  currentThemeDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  optionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  themeOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  themeOptionIconSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  themeOptionInfo: {
    flex: 1,
  },
  themeOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  themeOptionNameSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  themeOptionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  previewSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  previewHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  previewHeaderIcon: {
    padding: 4,
  },
  previewContent: {
    padding: 16,
  },
  previewText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  previewButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default ThemeSettingsScreen;
