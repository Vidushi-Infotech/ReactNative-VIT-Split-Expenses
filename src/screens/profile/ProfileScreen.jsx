import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Image, Modal, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { availableColorThemes, availableDisplayModes, getThemeColors } from '../../theme/theme';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

// Mock user data
const currentUser = {
  id: '1',
  name: 'John Doe',
  username: 'johndoe',
  email: 'john.doe@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
};

const ProfileScreen = ({ navigation }) => {
  const { isDarkMode, displayMode, colorTheme, setDisplayMode, setColorTheme, colors: themeColors } = useTheme();

  // Modal states
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showDisplayModeModal, setShowDisplayModeModal] = useState(false);

  const handleLogout = () => {
    // In a real app, we would clear auth tokens here
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const toggleDarkMode = () => {
    setDisplayMode(isDarkMode ? 'light' : 'dark');
  };

  const handleSelectColorTheme = (themeId) => {
    setColorTheme(themeId);
    setShowThemeModal(false);
  };

  const handleSelectDisplayMode = (modeId) => {
    setDisplayMode(modeId);
    setShowDisplayModeModal(false);
  };

  const renderSettingItem = (icon, title, subtitle, rightElement, onPress) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: themeColors.surface }]}
      onPress={onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.1) }]}>
        <Icon name={icon} size={20} color={themeColors.primary.default} />
      </View>

      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: themeColors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>}
      </View>

      {rightElement || (
        <Icon
          name="chevron-forward"
          size={20}
          color={themeColors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaWrapper>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
      <View style={[styles.profileCard, { backgroundColor: themeColors.surface }]}>
        <Image
          source={{ uri: currentUser.avatar }}
          style={styles.avatar}
        />

        <Text style={[styles.name, { color: themeColors.text }]}>{currentUser.name}</Text>
        <Text style={[styles.username, { color: themeColors.textSecondary }]}>@{currentUser.username}</Text>

        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.1) }]}
        >
          <Text style={[styles.editButtonText, { color: themeColors.primary.default }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Settings</Text>

        {renderSettingItem(
          'moon-outline',
          'Dark Mode',
          'Toggle dark mode on/off',
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: themeColors.gray[300], true: themeColors.primary.default }}
            thumbColor={themeColors.white}
          />
        )}

        {renderSettingItem(
          'color-palette-outline',
          'Theme Color',
          `Current: ${availableColorThemes.find(t => t.id === colorTheme)?.name || 'Blue'}`,
          null,
          () => setShowThemeModal(true)
        )}

        {renderSettingItem(
          'contrast-outline',
          'Display Mode',
          `Current: ${availableDisplayModes.find(m => m.id === displayMode)?.name || 'System'}`,
          null,
          () => setShowDisplayModeModal(true)
        )}

        {renderSettingItem(
          'notifications-outline',
          'Notifications',
          'Manage notification settings'
        )}

        {renderSettingItem(
          'lock-closed-outline',
          'Privacy',
          'Manage privacy settings'
        )}

        {renderSettingItem(
          'help-circle-outline',
          'Help & Support',
          'Get help or contact support'
        )}

        {renderSettingItem(
          'information-circle-outline',
          'About',
          'App version 1.0.0'
        )}
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: themeColors.surface }]}
        onPress={handleLogout}
      >
        <Icon name="log-out-outline" size={20} color={themeColors.danger} style={styles.logoutIcon} />
        <Text style={[styles.logoutText, { color: themeColors.danger }]}>Logout</Text>
      </TouchableOpacity>

      {/* Color Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: themeColors.surface }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Theme Color</Text>

            <FlatList
              data={availableColorThemes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.themeOption, {
                    borderColor: item.id === colorTheme ? themeColors.primary.default : 'transparent',
                  }]}
                  onPress={() => handleSelectColorTheme(item.id)}
                >
                  <View
                    style={[styles.colorSwatch, {
                      backgroundColor: getThemeColors(item.id).primary.default
                    }]}
                  />
                  <Text style={[styles.themeOptionText, { color: themeColors.text }]}>{item.name}</Text>
                  {item.id === colorTheme && (
                    <Icon name="checkmark" size={20} color={themeColors.primary.default} />
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: themeColors.gray[200] }]}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={{ color: themeColors.text }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Display Mode Selection Modal */}
      <Modal
        visible={showDisplayModeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDisplayModeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDisplayModeModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: themeColors.surface }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Display Mode</Text>

            <FlatList
              data={availableDisplayModes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.themeOption, {
                    borderColor: item.id === displayMode ? themeColors.primary.default : 'transparent',
                  }]}
                  onPress={() => handleSelectDisplayMode(item.id)}
                >
                  <Icon
                    name={item.id === 'light' ? 'sunny-outline' : item.id === 'dark' ? 'moon-outline' : 'contrast-outline'}
                    size={24}
                    color={themeColors.text}
                    style={styles.modeIcon}
                  />
                  <Text style={[styles.themeOptionText, { color: themeColors.text }]}>{item.name}</Text>
                  {item.id === displayMode && (
                    <Icon name="checkmark" size={20} color={themeColors.primary.default} />
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: themeColors.gray[200] }]}
              onPress={() => setShowDisplayModeModal(false)}
            >
              <Text style={{ color: themeColors.text }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
    </SafeAreaWrapper>
  );
};

// Helper function to get color with opacity
const getColorWithOpacity = (color, opacity) => {
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
  },
  editButtonText: {
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontWeight: '500',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 8,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  modeIcon: {
    marginRight: 12,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 16,
  },
  modalCloseButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
});

export default ProfileScreen;
