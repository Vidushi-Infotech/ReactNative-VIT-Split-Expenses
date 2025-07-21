
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';

const HelpandSupport = ({onClose}) => {
  const {theme} = useTheme();
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
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}></Text>

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
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    currencyLogo: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
  });

export default HelpandSupport;
