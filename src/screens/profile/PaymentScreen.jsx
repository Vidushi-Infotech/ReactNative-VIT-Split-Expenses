import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

const PaymentScreen = () => {
  const { colors: themeColors } = useTheme();
  const { userProfile, updateProfile } = useAuth();
  const navigation = useNavigation();

  // UPI related states
  const [upiId, setUpiId] = useState(userProfile?.upiId || '');
  const [isUpiEnabled, setIsUpiEnabled] = useState(userProfile?.isUpiEnabled || false);
  const [isDefaultPayment, setIsDefaultPayment] = useState(userProfile?.isDefaultPayment || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate UPI ID
  const validateUpiId = (id) => {
    // Basic UPI ID validation - username@provider
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return upiRegex.test(id);
  };

  // Handle UPI settings update
  const handleUpdateUpiSettings = async () => {
    setError('');

    // Validate UPI ID if UPI is enabled
    if (isUpiEnabled && !upiId.trim()) {
      setError('Please enter your UPI ID');
      return;
    }

    if (isUpiEnabled && !validateUpiId(upiId)) {
      setError('Please enter a valid UPI ID (e.g., username@upi)');
      return;
    }

    setLoading(true);
    try {
      // Update the user profile with UPI settings
      const success = await updateProfile({
        upiId: upiId,
        isUpiEnabled: isUpiEnabled,
        isDefaultPayment: isDefaultPayment
      });

      if (success) {
        Alert.alert(
          'Success',
          'Payment settings updated successfully'
        );
      } else {
        setError('Failed to update payment settings. Please try again.');
      }
    } catch (error) {
      console.error('Error updating payment settings:', error);
      setError('Failed to update payment settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle UPI enabled status
  const toggleUpiEnabled = () => {
    setIsUpiEnabled(!isUpiEnabled);
  };

  // Toggle default payment method
  const toggleDefaultPayment = () => {
    setIsDefaultPayment(!isDefaultPayment);
  };

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>UPI Integration</Text>

            {error ? (
              <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
            ) : null}

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>Enable UPI Payments</Text>
              <Switch
                value={isUpiEnabled}
                onValueChange={toggleUpiEnabled}
                trackColor={{ false: themeColors.gray[300], true: themeColors.primary.default }}
                thumbColor={themeColors.white}
              />
            </View>

            {isUpiEnabled && (
              <>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>UPI ID</Text>
                <View style={[styles.inputContainer, {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border
                }]}>
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder="Enter your UPI ID (e.g., username@upi)"
                    placeholderTextColor={themeColors.textSecondary}
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>Set as Default Payment Method</Text>
                  <Switch
                    value={isDefaultPayment}
                    onValueChange={toggleDefaultPayment}
                    trackColor={{ false: themeColors.gray[300], true: themeColors.primary.default }}
                    thumbColor={themeColors.white}
                    disabled={!isUpiEnabled}
                  />
                </View>
              </>
            )}

            <View style={styles.infoContainer}>
              <Icon name="information-circle-outline" size={20} color={themeColors.textSecondary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
                Your UPI ID will be used for receiving payments from other users. Make sure to enter a valid UPI ID.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, {
                backgroundColor: themeColors.primary.default,
                opacity: loading ? 0.7 : 1
              }]}
              onPress={handleUpdateUpiSettings}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Save Payment Settings</Text>
              )}
            </TouchableOpacity>
          </View>


        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

});

export default PaymentScreen;
