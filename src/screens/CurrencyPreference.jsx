
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

const CurrencyPreference = ({onClose}) => {
  const {theme} = useTheme();
  const styles = createStyles(theme);

  const currencyOptions = [
    {code: 'INR', logo: '₹'},
    {code: 'USD', logo: '$'},
  ];

  const [selectedCurrency, setSelectedCurrency] = useState('INR');

  const handleCurrencySelect = code => {
    setSelectedCurrency(code);
    Alert.alert('Preference Saved', `You selected ${code} as your currency.`);
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
        <Text style={styles.headerTitle}>Currency Preference</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}>Select Currency Preference</Text>

        {currencyOptions.map(({code, logo}) => (
          <TouchableOpacity
            key={code}
            style={styles.option}
            onPress={() => handleCurrencySelect(code)}>
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                <Text style={styles.currencyLogo}>{logo}</Text>
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{code}</Text>
              </View>
            </View>
            {selectedCurrency === code && (
              <Ionicons
                name="checkmark"
                size={20}
                color={theme.colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
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

export default CurrencyPreference;
