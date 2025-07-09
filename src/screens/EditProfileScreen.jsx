import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {launchImageLibrary} from 'react-native-image-picker';
import firebaseService from '../services/firebaseService';

const EditProfileScreen = ({onClose}) => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    alternateMobile: '',
    address: '',
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [selectedAltCountryCode, setSelectedAltCountryCode] = useState('+91');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUri, setProfileImageUri] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async (retryCount = 0) => {
    if (!user) return;

    setLoading(true);
    try {
      const userProfile = await firebaseService.getUserProfile(user.uid);
      if (userProfile) {
        setFormData({
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          email: userProfile.email || user.email || '',
          mobileNumber: extractPhoneNumber(userProfile.phoneNumber) || '',
          alternateMobile:
            extractPhoneNumber(userProfile.alternateMobile) || '',
          address: userProfile.address || '',
        });

        // Extract country code from phone number
        if (userProfile.phoneNumber) {
          const countryCode = extractCountryCode(userProfile.phoneNumber);
          setSelectedCountryCode(countryCode);
        }

        // Extract country code from alternate mobile
        if (userProfile.alternateMobile) {
          const altCountryCode = extractCountryCode(
            userProfile.alternateMobile,
          );
          setSelectedAltCountryCode(altCountryCode);
        }

        setProfileImageUri(userProfile.profileImageUrl || null);
      } else {
        // If no profile exists, populate with Firebase Auth data
        loadFallbackData();
      }
    } catch (error) {
      // Handle Firestore unavailable error with retry logic
      if (error.code === 'firestore/unavailable' && retryCount < 2) {
        console.log(
          `Firestore unavailable, retrying... attempt ${retryCount + 1}`,
        );
        setTimeout(() => {
          loadUserProfile(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      // If all retries failed or other error, use fallback data
      if (error.code === 'firestore/unavailable') {
        console.log(
          'Firestore service unavailable, using Firebase Auth data as fallback',
        );
      } else {
        console.error('Error loading user profile:', error);
      }

      loadFallbackData();

      // Only show error alert for non-network issues
      if (error.code !== 'firestore/unavailable') {
        Alert.alert(
          'Warning',
          'Could not load profile data from server. Using available information.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    // Use Firebase Auth data as fallback
    setFormData({
      firstName: user.displayName?.split(' ')[0] || '',
      lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      mobileNumber: '',
      alternateMobile: '',
      address: '',
    });

    // Reset country codes to default when no data
    setSelectedCountryCode('+91');
    setSelectedAltCountryCode('+91');
    setProfileImageUri(user.photoURL || null);
  };

  const extractPhoneNumber = fullPhoneNumber => {
    if (!fullPhoneNumber) return '';

    const phoneStr = fullPhoneNumber.toString().trim();

    // For India (+91), remove +91 specifically
    if (phoneStr.startsWith('+91')) {
      return phoneStr.substring(3); // Remove '+91' (3 characters)
    }

    // For other country codes, remove +1 to +999
    if (phoneStr.startsWith('+1') && phoneStr.length >= 12) {
      return phoneStr.substring(2); // Remove '+1' (2 characters)
    }

    if (phoneStr.startsWith('+')) {
      // Find where country code ends (look for pattern)
      const match = phoneStr.match(/^\+(\d{1,3})/);
      if (match) {
        return phoneStr.substring(match[0].length);
      }
    }

    // If no country code, return as is
    return phoneStr;
  };

  const extractCountryCode = fullPhoneNumber => {
    if (!fullPhoneNumber) return '+91';

    const phoneStr = fullPhoneNumber.toString().trim();

    // Specific country code extraction
    if (phoneStr.startsWith('+91')) {
      return '+91';
    }

    if (phoneStr.startsWith('+1')) {
      return '+1';
    }

    if (phoneStr.startsWith('+44')) {
      return '+44';
    }

    if (phoneStr.startsWith('+971')) {
      return '+971';
    }

    if (phoneStr.startsWith('+33')) {
      return '+33';
    }

    if (phoneStr.startsWith('+852')) {
      return '+852';
    }

    // Generic extraction for other country codes
    if (phoneStr.startsWith('+')) {
      // Check for 3-digit country codes first
      const match3 = phoneStr.match(/^\+(\d{3})/);
      if (match3 && phoneStr.length >= 7) {
        // Ensure there's a number after country code
        return `+${match3[1]}`;
      }

      // Check for 2-digit country codes
      const match2 = phoneStr.match(/^\+(\d{2})/);
      if (match2 && phoneStr.length >= 6) {
        return `+${match2[1]}`;
      }

      // Check for 1-digit country codes
      const match1 = phoneStr.match(/^\+(\d{1})/);
      if (match1 && phoneStr.length >= 5) {
        return `+${match1[1]}`;
      }
    }

    // If no + prefix but starts with 91 (India without +)
    if (phoneStr.startsWith('91') && phoneStr.length >= 12) {
      return '+91';
    }

    // Default to India
    return '+91';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = async (retryCount = 0) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    console.log('Starting save process...', {retryCount, saving});
    setSaving(true);

    try {
      let profileImageUrl = profileImageUri;

      // Upload new profile image if selected
      if (profileImage) {
        console.log('Uploading profile image...');
        try {
          profileImageUrl = await firebaseService.uploadProfileImage(
            profileImage,
            user.uid,
          );
          console.log('Profile image uploaded successfully:', profileImageUrl);
        } catch (imageError) {
          console.warn('Failed to upload profile image:', imageError);
          Alert.alert(
            'Warning',
            'Profile image upload failed, but other changes will be saved.',
          );
        }
      }

      // Prepare updated user data
      const updatedUserData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.mobileNumber.trim()
          ? `${selectedCountryCode}${formData.mobileNumber.trim()}`
          : null,
        alternateMobile: formData.alternateMobile.trim()
          ? `${selectedAltCountryCode}${formData.alternateMobile.trim()}`
          : null,
        address: formData.address.trim(),
        displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        profileImageUrl: profileImageUrl,
      };

      console.log('Updating user profile data:', updatedUserData);

      // Try to update user profile in Firestore
      let firestoreSuccess = false;
      try {
        await firebaseService.updateUserProfile(updatedUserData);
        firestoreSuccess = true;
        console.log('Firestore profile update successful');
      } catch (firestoreError) {
        console.log(
          'Firestore error:',
          firestoreError.code,
          firestoreError.message,
        );

        if (firestoreError.code === 'firestore/unavailable' && retryCount < 2) {
          console.log(`Retrying profile save... attempt ${retryCount + 1}`);
          setSaving(false); // Reset saving state before retry
          setTimeout(() => {
            handleSaveChanges(retryCount + 1);
          }, 2000 * (retryCount + 1));
          return;
        }

        console.warn('Firestore update failed after retries:', firestoreError);
      }

      // Always try to update Firebase Auth profile (this works offline)
      let authSuccess = false;
      try {
        await user.updateProfile({
          displayName: updatedUserData.displayName,
          photoURL: profileImageUrl,
        });
        authSuccess = true;
        console.log('Firebase Auth profile update successful');
      } catch (authError) {
        console.warn('Auth profile update failed:', authError);
      }

      // Show appropriate success/warning message
      if (firestoreSuccess && authSuccess) {
        Alert.alert('Success', 'Profile updated successfully!');
      } else if (authSuccess) {
        Alert.alert(
          'Partial Success',
          'Profile updated locally. Some data may not sync to server due to connectivity issues.',
        );
      } else if (firestoreSuccess) {
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Warning', 'Profile update had issues. Please try again.');
      }

      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);

      if (error.code === 'firestore/unavailable') {
        Alert.alert(
          'Network Error',
          'Unable to save changes due to connectivity issues. Please try again later.',
        );
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditPhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setProfileImage(asset.uri);
        setProfileImageUri(asset.uri);
      }
    });
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            <Image
              source={{
                uri:
                  profileImageUri ||
                  'https://via.placeholder.com/150x150/333/fff?text=' +
                    (formData.firstName ? formData.firstName.charAt(0) : 'U'),
              }}
              style={styles.profilePhoto}
            />
            <TouchableOpacity
              style={styles.editPhotoButton}
              onPress={handleEditPhoto}>
              <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.firstName}
              onChangeText={value => handleInputChange('firstName', value)}
              placeholder="Enter first name"
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.lastName}
              onChangeText={value => handleInputChange('lastName', value)}
              placeholder="Enter last name"
            />
          </View>

          {/* Email ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email ID</Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={value => handleInputChange('email', value)}
              placeholder="Enter email"
              keyboardType="email-address"
            />
          </View>

          {/* Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity style={styles.countryCodeButton}>
                <Image
                  source={{uri: 'https://flagcdn.com/w40/in.png'}}
                  style={styles.flagIcon}
                />
                <Text style={styles.countryCode}>{selectedCountryCode}</Text>
                <Ionicons name="chevron-down" size={12} color="#6B7280" />
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                value={formData.mobileNumber}
                onChangeText={value => handleInputChange('mobileNumber', value)}
                placeholder="Enter mobile number"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          {/* Alternate Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Alternate Mobile Number</Text>
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity style={styles.countryCodeButton}>
                <Image
                  source={{uri: 'https://flagcdn.com/w40/in.png'}}
                  style={styles.flagIcon}
                />
                <Text style={styles.countryCode}>{selectedAltCountryCode}</Text>
                <Ionicons name="chevron-down" size={12} color="#6B7280" />
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                value={formData.alternateMobile}
                onChangeText={value =>
                  handleInputChange('alternateMobile', value)
                }
                placeholder="Enter Alternate Mobile No."
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.textInput}
              value={formData.address}
              onChangeText={value => handleInputChange('address', value)}
              placeholder="Enter Your Address"
              multiline
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveChanges}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
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
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    placeholder: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    photoSection: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    photoContainer: {
      position: 'relative',
    },
    profilePhoto: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    editPhotoButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.surface,
    },

    formSection: {
      paddingHorizontal: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      fontWeight: '500',
    },
    textInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    phoneInputContainer: {
      flexDirection: 'row',
    },
    countryCodeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      minWidth: 100,
    },
    flagIcon: {
      width: 24,
      height: 16,
      marginRight: 8,
    },
    countryCode: {
      fontSize: 16,
      color: theme.colors.text,
      marginRight: 4,
    },

    phoneInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      marginLeft: 12,
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
    saveButtonDisabled: {
      opacity: 0.6,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
  });

export default EditProfileScreen;
