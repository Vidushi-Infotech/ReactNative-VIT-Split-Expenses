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

const FAQs = ({onClose}) => {
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
        <Text style={styles.text}>Frequently Asked Questions</Text>

        <View style={styles.faqItem}>
          <Text style={styles.question}>1. How does Splitzy work?</Text>
          <Text style={styles.answer}>
            Splitzy lets you manage group expenses and split bills easily with
            friends or roommates.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>
            2. Can I use Splitzy without an account?
          </Text>
          <Text style={styles.answer}>
            No, you need to create an account to track and sync your expenses
            securely.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.question}>3. Is my data private?</Text>
          <Text style={styles.answer}>
            Yes. We do not share your data with third parties and your
            information is stored securely.
          </Text>
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
    faqItem: {
      marginBottom: 24,
      marginHorizontal: 20,
    },
    question: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    answer: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },  
  });

export default FAQs;
