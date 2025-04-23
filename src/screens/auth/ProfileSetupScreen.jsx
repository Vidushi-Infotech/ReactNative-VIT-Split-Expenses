import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';

const ProfileSetupScreen = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const { isDarkMode, colors: themeColors } = useTheme();
  const { setupProfile } = useAuth();
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProfileSetup = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      // Use the setupProfile function from AuthContext
      const profileData = {
        name: name.trim(),
        username: username.trim() || undefined,
        avatar: profileImage,
      };

      await setupProfile(profileData);
      // The AuthContext will handle the login automatically
    } catch (error) {
      setError('Failed to create profile. Please try again.');
      console.error('Error setting up profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = () => {
    // In a real app, you would use image picker library
    // For demo purposes, we'll just set a random image
    const randomImage = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`;
    setProfileImage(randomImage);
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>

        <Animated.View
          entering={FadeInUp.duration(800).delay(200)}
          style={styles.header}
        >
          <Text style={[styles.title, { color: themeColors.text }]}>Complete Your Profile</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Set up your profile to get started with VitSplit
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(800).delay(400)}
          style={styles.form}
        >
          {error ? (
            <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleSelectImage}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: themeColors.primary.light + '30' }]}>
                <Icon name="camera-outline" size={32} color={themeColors.primary.default} />
              </View>
            )}
            <View style={[styles.addImageButton, { backgroundColor: themeColors.primary.default }]}>
              <Icon name="add" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={themeColors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>Username (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }
              ]}
              placeholder="Choose a username"
              placeholderTextColor={themeColors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.phoneContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>Phone Number</Text>
            <View style={[
              styles.phoneDisplay,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border
              }
            ]}>
              <Text style={[styles.phoneText, { color: themeColors.textSecondary }]}>
                {phoneNumber}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: name.trim()
                  ? themeColors.primary.default
                  : themeColors.primary.default + '80'
              }
            ]}
            onPress={handleProfileSetup}
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Complete Profile</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>
            You can always update your profile later
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSizes.base,
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: spacing.xxl,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    fontSize: fontSizes.base,
  },
  phoneContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  phoneDisplay: {
    width: '100%',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  phoneText: {
    fontSize: fontSizes.base,
  },
  button: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  skipText: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
    width: '100%',
  },
});

export default ProfileSetupScreen;
