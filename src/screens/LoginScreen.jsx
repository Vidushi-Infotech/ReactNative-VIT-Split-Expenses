import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useTheme} from '../context/ThemeContext';
import ThemedAlert from '../components/ThemedAlert';

const LoginScreen = ({navigation}) => {
  const {signIn, loading, getErrorMessage, isAndroid} = useAuth();
  const {theme} = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Helper function to show themed alerts
  const showThemedAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlert(true);
  };

  const handleSignup = () => {
    // Navigate to register screen
    navigation.navigate('Register');
  };

  const handlePhoneLogin = () => {
    // Navigate to phone login screen
    navigation.navigate('PhoneLogin');
  };

  const handleGoogleLogin = () => {
    // Handle Google login
    console.log('Google login');
  };

  const handleAppleLogin = () => {
    // Handle Apple login
    console.log('Apple login');
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../Assets/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Splitzy</Text>
        </View>

        {/* Welcome Text */}
        <Text style={styles.welcomeText}>Welcome to Splitzy!</Text>

        {/* Sign In Section */}
        <Text style={styles.signInTitle}>Login</Text>

        {/* Phone Login Button */}
        <TouchableOpacity
          style={styles.phoneLoginButton}
          onPress={handlePhoneLogin}>
          <Text style={styles.phoneLoginText}>Login With Phone Number</Text>
        </TouchableOpacity> 

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignup}>
            <Text style={styles.signupLink}>Signup Now</Text>
          </TouchableOpacity>
        </View>

        {/* Social Login Section */}
        {/* <Text style={styles.socialTitle}>Or Sign in With</Text> */}

        {/* <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleLogin}>
            <Image
              source={require('../Assets/GoogleLogo.png')}
              style={styles.socialLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleAppleLogin}>
            <Image
              source={require('../Assets/AppleLogo.png')}
              style={styles.socialLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View> */}
      </ScrollView>

      {/* Themed Alert */}
      <ThemedAlert
        visible={showAlert}
        title={alertTitle}
        message={alertMessage}
        buttons={[
          {
            text: 'OK',
            style: 'default',
            onPress: () => setShowAlert(false),
          },
        ]}
        onClose={() => setShowAlert(false)}
      />
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
      flexGrow: 1,
      paddingHorizontal: 32,
      paddingTop: 40,
      paddingBottom: 40,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 12,
    },
    brandName: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 40,
    },
    signInTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 20,
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
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: 8,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    loginButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      marginTop: 24,
      marginBottom: 16,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    loginButtonDisabled: {
      backgroundColor: theme.colors.textMuted,
    },
    phoneLoginButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingVertical: 16,
      marginBottom: 24,
    },
    phoneLoginText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
    },
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 32,
    },
    signupText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    signupLink: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    socialTitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
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
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
    socialLogo: {
      width: 24,
      height: 24,
    },
  });

export default LoginScreen;
