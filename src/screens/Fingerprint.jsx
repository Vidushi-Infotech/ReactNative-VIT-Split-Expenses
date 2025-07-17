import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';

const Fingerprint = ({onClose}) => {
  const {theme} = useTheme();
  const styles = createStyles(theme);
  const [isEnabled, setIsEnabled] = useState(false);
  const rnBiometrics = new ReactNativeBiometrics();

  // Load saved fingerprint toggle state on mount
  useEffect(() => {
    const loadState = async () => {
      const stored = await AsyncStorage.getItem('appLockEnabled');
      if (stored === 'true') {
        setIsEnabled(true);
      }
    };
    loadState();
  }, []);

  const handleToggle = async () => {
    const {available, biometryType} = await rnBiometrics.isSensorAvailable();
    console.log('Available:', available, 'Type:', biometryType);
    console.log('Biometric available:', available);
    console.log('Biometric type:', biometryType);
    console.log('Toggle changed');

    if (!available) {
      Alert.alert('Biometric not available on this device');
      return;
    }

    if (!isEnabled) {
      try {
        const {success} = await rnBiometrics.simplePrompt({
          promptMessage: 'Authenticate with biometrics',
        });

        if (success) {
          setIsEnabled(true);
          await AsyncStorage.setItem('appLockEnabled', 'true');
          Alert.alert('Biometric authentication enabled');
        } else {
          Alert.alert('Authentication cancelled');
        }
      } catch (error) {
        Alert.alert('Authentication failed');
      }
    } else {
      setIsEnabled(false);
      await AsyncStorage.setItem('appLockEnabled', 'false');
      Alert.alert('Biometric authentication disabled');
    }
  };

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
        <Text style={styles.headerTitle}>Fingerprint</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="finger-print"
            size={64}
            color={theme.colors.primary}
          />
        </View>

        <Text style={styles.title}>Enable Fingerprint </Text>
        <Text style={styles.description}>
          Use your fingerprint to quickly and securely access your account.
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable Fingerprint</Text>
          <Switch
            trackColor={{false: '#767577', true: theme.colors.primary}}
            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleToggle}
            value={isEnabled}
          />
        </View>
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
    scrollContent: {
      padding: 20,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 24,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    toggleLabel: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
  });

export default Fingerprint;
