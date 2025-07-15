import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';
import Dropdown from '../components/Dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Language = ({onClose}) => {
  const {theme} = useTheme();
  const styles = createStyles(theme);

  const languageOptions = [
    {label: 'English', value: 'en'},
    {label: 'Spanish', value: 'es'},
    {label: 'French', value: 'fr'},
    {label: 'German', value: 'de'},
    {label: 'Italian', value: 'it'},
    {label: 'Japanese', value: 'ja'},
    {label: 'Korean', value: 'ko'},
  ];

  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load saved language preference
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguagePreference();
  }, []);

  const handleSaveLanguage = async () => {
    if (!selectedLanguage) {
      setError('Please select a language');
      return;
    }

    try {
      await AsyncStorage.setItem('language', selectedLanguage.value);
      onClose();
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSelectLanguage = item => {
    setSelectedLanguage(item);
    setError(null);
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
        <Text style={styles.headerTitle}>Language</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style = {styles.text}>Set Default Language</Text>
        <Dropdown
          label="Language"
          placeholder="Select Language"
          value={selectedLanguage}
          onSelect={handleSelectLanguage}
          options={languageOptions}
          style={styles.dropdown}
          error={error}
        />
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveLanguage}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
    text: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      margin: 20,
    },
    dropdown: {
      marginHorizontal: 20,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      marginHorizontal: 20,
      marginVertical: 30,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: theme.colors.border,
      marginHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default  Language;
