import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleSignUp = () => {
    // Handle registration logic
    console.log('Registering user...');
    // Navigate to OTP verification or main app
    navigation.replace('Main');
  };

  const handleSignIn = () => {
    // Navigate back to login screen
    navigation.goBack();
  };

  const handleGoogleSignUp = () => {
    // Handle Google signup
    console.log('Google signup');
  };

  const handleAppleSignUp = () => {
    // Handle Apple signup
    console.log('Apple signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.header}>Register</Text>

        {/* First Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Your First Name"
            placeholderTextColor="#ADB5BD"
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
            placeholderTextColor="#ADB5BD"
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
            placeholderTextColor="#ADB5BD"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Mobile Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <View style={styles.phoneInputContainer}>
            {/* Country Code Dropdown */}
            <TouchableOpacity style={styles.countryCodeButton} onPress={() => setShowCountryPicker(!showCountryPicker)}>
              <Text style={styles.flagEmoji}>🇮🇳</Text>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            
            {/* Phone Number Input */}
            <TextInput
              style={styles.phoneTextInput}
              placeholder="Enter Your Phone Number"
              placeholderTextColor="#ADB5BD"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          
          {/* Country Picker Dropdown */}
          {showCountryPicker && (
            <View style={styles.countryPickerContainer}>
              <TouchableOpacity 
                style={styles.countryOption} 
                onPress={() => {
                  setCountryCode('+91');
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={styles.countryName}>India</Text>
                <Text style={styles.countryCodeOption}>+91</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.countryOption} 
                onPress={() => {
                  setCountryCode('+1');
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.flagEmoji}>🇺🇸</Text>
                <Text style={styles.countryName}>United States</Text>
                <Text style={styles.countryCodeOption}>+1</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Your Password"
            placeholderTextColor="#ADB5BD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Confirm Your Password"
            placeholderTextColor="#ADB5BD"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        {/* Referral Code */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Referral Code</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Referral Code"
            placeholderTextColor="#ADB5BD"
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
          />
        </View>

        {/* Terms and Privacy */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Services</Text>
            {' '}and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleSignIn}>
            <Text style={styles.signInLink}>Signin Now</Text>
          </TouchableOpacity>
        </View>

        {/* Social Login Section */}
        <Text style={styles.socialTitle}>Or Sign in With</Text>
        
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignUp}>
            <View style={styles.googleLogo}>
              <Text style={styles.googleG}>G</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignUp}>
            <View style={styles.appleLogo}>
              <Text style={styles.appleIcon}></Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: '#F7FAFC',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    height: 56,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    minWidth: 80,
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#718096',
  },
  phoneTextInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: 'transparent',
  },
  countryPickerContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    marginLeft: 8,
  },
  countryCodeOption: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  termsContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  signUpButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 24,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  signInText: {
    fontSize: 14,
    color: '#718096',
  },
  signInLink: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  socialTitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  googleG: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    fontFamily: 'System',
    textAlign: 'center',
  },
  appleLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RegisterScreen;
