import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';

const ContactSupport = ({onClose}) => {
  const {theme} = useTheme();
  const styles = createStyles(theme);

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@splitzy.in');
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
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}>
          For any queries or feedback, please reach us at:
        </Text>

        <TouchableOpacity onPress={handleEmailPress} activeOpacity={0.7}>
          <View style={styles.emailContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.colors.icon}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.emailText}>support@splitzy.in</Text>
          </View>
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
      marginBottom: 12,
      marginHorizontal: 20,
      marginTop: 24,
    },
    emailContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    emailText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
  });

export default ContactSupport;
