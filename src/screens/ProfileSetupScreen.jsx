import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const ProfileSetup = ({navigation, route}) => {
  const {theme} = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(theme);

  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      setIsLoading(true);
      const newUser = await signUp(
        email.trim(),
        firstName.trim(),
        lastName.trim(),
      );

      // Process referral code if provided
      if (referralCode.trim() && newUser) {
        console.log('🎁 Processing referral code during signup:', referralCode);
        const userName = `${firstName.trim()} ${lastName.trim()}`.trim();
        await firebaseService.processReferralCode(
          newUser.uid,
          referralCode.trim(),
          userName,
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to save your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Complete Your Profile</Text>

        {/* First Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Your First Name"
            placeholderTextColor={theme.colors.textSecondary}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
        </View>

        {/* Last Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Your Last Name"
            placeholderTextColor={theme.colors.textSecondary}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email ID</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Your Email ID"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Referral Code */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Referral Code</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Referral Code"
            placeholderTextColor={theme.colors.textSecondary}
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save & Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: '600',
      marginBottom: 20,
      color: theme.colors.text,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    inputContainer: {
      marginBottom: 20,
      position: 'relative',
    },
    inputLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      fontWeight: '500',
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
  });

export default ProfileSetup;
