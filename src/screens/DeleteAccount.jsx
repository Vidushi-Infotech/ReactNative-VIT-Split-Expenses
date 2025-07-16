import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';

// Constants for better performance
const CONSEQUENCES = [
  {id: 1, text: 'Delete all your expense data'},
  {id: 2, text: 'Remove you from all groups'},
  {id: 3, text: 'Delete your profile permanently'},
  {id: 4, text: 'Cannot be recovered'},
];

const DeleteAccount = ({onClose}) => {
  const {theme} = useTheme();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Validate password (minimum 6 characters for demo)
  const validatePassword = useCallback(pwd => {
    if (!pwd.trim()) {
      return 'Password is required';
    }
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }, []);

  // Optimized handlers with useCallback
  const handlePasswordChange = useCallback(
    text => {
      setPassword(text);
      if (passwordError) {
        setPasswordError('');
      }
    },
    [passwordError],
  );

  const handleDeleteAccount = useCallback(() => {
    const error = validatePassword(password);
    if (error) {
      setPasswordError(error);
      return;
    }
    setShowConfirmModal(true);
  }, [password, validatePassword]);

  const confirmDelete = useCallback(() => {
    setShowConfirmModal(false);
    Alert.alert(
      'Account Deleted',
      'Your account has been permanently deleted.',
      [
        {
          text: 'OK',
          onPress: () => onClose(),
        },
      ],
    );
  }, [onClose]);

  const cancelDelete = useCallback(() => {
    setShowConfirmModal(false);
    setPasswordError('');
  }, []);

  // Memoized consequence item component
  const ConsequenceItem = useMemo(
    () =>
      ({text}) =>
        (
          <View style={styles.consequenceItem}>
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.error}
            />
            <Text style={styles.consequenceText}>{text}</Text>
          </View>
        ),
    [styles.consequenceItem, styles.consequenceText, theme.colors.error],
  );

  // Memoize button disabled state
  const isDeleteDisabled = useMemo(() => {
    return !password.trim() || password.length < 6;
  }, [password]);

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
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
          {/* Warning Icon */}
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={60} color={theme.colors.error} />
          </View>

          {/* Warning Text */}
          <Text style={styles.warningTitle}>Delete Your Account</Text>
          <Text style={styles.warningText}>
            Deleting your account is a permanent action and cannot be undone.
            This will:
          </Text>

          {/* Consequences List */}
          <View style={styles.consequencesList}>
            {CONSEQUENCES.map(consequence => (
              <ConsequenceItem key={consequence.id} text={consequence.text} />
            ))}
          </View>

          <Text style={styles.warningText}>
            Enter your Password to continue
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.textInput,
                passwordError ? styles.textInputError : null,
              ]}
              placeholder="Enter Your Password"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              isDeleteDisabled && styles.deleteButtonDisabled,
            ]}
            onPress={handleDeleteAccount}
            disabled={isDeleteDisabled}>
            <Text
              style={[
                styles.deleteButtonText,
                isDeleteDisabled && styles.deleteButtonTextDisabled,
              ]}>
              Delete My Account
            </Text>
          </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={40} color={theme.colors.error} />
            <Text style={styles.modalTitle}>Are you absolutely sure?</Text>
            <Text style={styles.modalText}>
              This action cannot be undone. Your account and all data will be
              permanently deleted.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDelete}>
                <Text style={styles.confirmDeleteButtonText}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    scrollView: {
      flex: 1,
    },
    warningContainer: {
      marginBottom: 16,
      marginTop: 16,
      alignItems: 'center',
    },
    warningTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.error,
      marginBottom: 16,
      textAlign: 'center',
    },
    warningText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      margin: 20,
    },
    consequencesList: {
      width: '100%',
      marginBottom: 24,
    },
    consequenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    consequenceText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 12,
      flex: 1,
    },
    inputContainer: {
      marginBottom: 24,
      marginHorizontal: 20,
    },
    inputLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      fontWeight: '500',
      textAlign: 'left',
    },
    deleteButton: {
      backgroundColor: theme.colors.error,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      width: '100%',
      alignItems: 'center',
    },
    deleteButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    deleteButtonDisabled: {
      backgroundColor: theme.colors.borderLight,
      opacity: 0.6,
    },
    deleteButtonTextDisabled: {
      color: theme.colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      width: '100%',
      maxWidth: 320,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 12,
      textAlign: 'center',
    },
    modalText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    modalButtons: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.colors.borderLight,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    confirmDeleteButton: {
      flex: 1,
      backgroundColor: theme.colors.error,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    confirmDeleteButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
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
      width: '100%',
    },
    textInputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'left',
    },
  });

export default DeleteAccount;
