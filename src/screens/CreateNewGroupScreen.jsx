import React, { useState, useEffect } from 'react';
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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Contacts from 'react-native-contacts';
import firebaseService from '../services/firebaseService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CreateNewGroupScreen = ({ onClose, onSave }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    coverImage: null,
    coverImageUrl: null,
  });
  
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [hasContactsPermission, setHasContactsPermission] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [registeredUsersLoading, setRegisteredUsersLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  // Watch for registered users to load and trigger contact loading
  useEffect(() => {
    if (registeredUsers.length > 0 && hasContactsPermission && !contactsLoading && contacts.length === 0) {
      console.log('Registered users loaded, triggering contact loading...');
      loadContacts(0);
    }
  }, [registeredUsers, hasContactsPermission]);

  const initializeData = async () => {
    try {
      console.log('🚀 Initializing CreateNewGroupScreen data...');
      
      // First load registered users, then request permissions
      await loadRegisteredUsers();
      await requestContactsPermission();
      
      console.log('✅ Initialization complete');
    } catch (error) {
      console.error('❌ Error initializing data:', error);
    }
  };

  const loadRegisteredUsers = async (retryCount = 0) => {
    setRegisteredUsersLoading(true);
    try {
      console.log('📋 Loading registered users from Firebase...');
      
      // Get all registered users from Firebase
      const usersSnapshot = await firebaseService.firestore.collection('users').get();
      const users = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Loaded', users.length, 'registered users from Firebase');
      setRegisteredUsers(users);
      
    } catch (error) {
      console.error('❌ Error loading registered users:', error);
      
      // Retry logic for network issues
      if (retryCount < 2) {
        console.log(`🔄 Retrying registered users load... attempt ${retryCount + 1}`);
        setTimeout(() => {
          loadRegisteredUsers(retryCount + 1);
        }, 1500);
        return;
      }
    } finally {
      setRegisteredUsersLoading(false);
    }
  };

  const requestContactsPermission = async () => {
    try {
      console.log('🔐 Requesting contacts permission...');
      let permissionResult;
      
      if (Platform.OS === 'android') {
        permissionResult = await request(PERMISSIONS.ANDROID.READ_CONTACTS);
      } else {
        permissionResult = await request(PERMISSIONS.IOS.CONTACTS);
      }

      if (permissionResult === RESULTS.GRANTED) {
        console.log('✅ Contacts permission granted');
        setHasContactsPermission(true);
        // Don't load contacts here - let useEffect handle it when both conditions are met
      } else {
        console.log('❌ Contacts permission denied');
        setHasContactsPermission(false);
        Alert.alert(
          'Permission Required',
          'Please allow access to contacts to add members from your registered friends.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Allow Access', onPress: () => requestContactsPermission() }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error requesting contacts permission:', error);
      Alert.alert('Error', 'Failed to request contacts permission');
    }
  };

  const loadContacts = async (retryCount = 0) => {
    if (contactsLoading) {
      console.log('📱 Contacts already loading, skipping...');
      return;
    }
    
    setContactsLoading(true);
    try {
      console.log('📱 Starting contact loading process...');
      
      if (!Contacts || !Contacts.getAll) {
        throw new Error('Contacts module not available');
      }

      // Ensure registered users are loaded before filtering
      if (registeredUsers.length === 0) {
        console.log('❌ No registered users available yet, cannot filter contacts');
        setContactsLoading(false);
        return;
      }
      
      console.log('📱 Loading contacts with', registeredUsers.length, 'registered users');
      const contactsList = await Contacts.getAll();
      console.log('📱 Loaded', contactsList.length, 'local contacts');
      
      // Filter contacts to show only registered users
      const filteredContacts = contactsList
        .filter(contact => {
          if (!contact.displayName || contact.displayName.trim() === '') return false;
          
          // Check if any phone number or email matches a registered user
          const phoneNumbers = contact.phoneNumbers || [];
          const emailAddresses = contact.emailAddresses || [];
          
          return registeredUsers.some(registeredUser => {
            // Exclude current user from contacts list (group creator)
            if (user && registeredUser.uid === user.uid) {
              return false;
            }
            
            // Check phone numbers with improved matching
            const userPhone = registeredUser.phoneNumber;
            if (userPhone && phoneNumbers.some(phone => {
              const localNumber = phone.number.trim();
              const dbNumber = userPhone.trim();
              
              // Normalize both numbers (remove all non-digits)
              const localDigits = localNumber.replace(/\D/g, '');
              const dbDigits = dbNumber.replace(/\D/g, '');
              
              // Case 1: Exact match with country code
              if (localNumber === dbNumber) {
                return true;
              }
              
              // Case 2: Both have digits only - exact match
              if (localDigits === dbDigits) {
                return true;
              }
              
              // Case 3: Database has country code, local doesn't
              // Remove country code from database number and compare
              if (dbNumber.startsWith('+91') && dbDigits.length >= 12) {
                const dbWithoutCountry = dbDigits.substring(2); // Remove '91'
                if (localDigits === dbWithoutCountry) {
                  return true;
                }
              }
              
              // Case 4: Local has country code, database doesn't
              if (localNumber.startsWith('+91') && localDigits.length >= 12) {
                const localWithoutCountry = localDigits.substring(2); // Remove '91'
                if (dbDigits === localWithoutCountry) {
                  return true;
                }
              }
              
              // Case 5: Both have country codes but different formats
              if (dbDigits.startsWith('91') && localDigits.startsWith('91')) {
                const dbMain = dbDigits.substring(2);
                const localMain = localDigits.substring(2);
                if (dbMain === localMain) {
                  return true;
                }
              }
              
              return false;
            })) {
              return true;
            }
            
            // Check email addresses
            const userEmail = registeredUser.email;
            if (userEmail && emailAddresses.some(email => 
              email.email.toLowerCase() === userEmail.toLowerCase()
            )) {
              return true;
            }
            
            return false;
          });
        })
        .map(contact => {
          // Find the matching registered user info (excluding current user)
          const matchingUser = registeredUsers.find(registeredUser => {
            // Exclude current user
            if (user && registeredUser.uid === user.uid) {
              return false;
            }
            
            const phoneNumbers = contact.phoneNumbers || [];
            const emailAddresses = contact.emailAddresses || [];
            
            const userPhone = registeredUser.phoneNumber;
            if (userPhone && phoneNumbers.some(phone => {
              const localNumber = phone.number.trim();
              const dbNumber = userPhone.trim();
              
              // Use same matching logic as in filter
              const localDigits = localNumber.replace(/\D/g, '');
              const dbDigits = dbNumber.replace(/\D/g, '');
              
              if (localNumber === dbNumber) return true;
              if (localDigits === dbDigits) return true;
              
              if (dbNumber.startsWith('+91') && dbDigits.length >= 12) {
                const dbWithoutCountry = dbDigits.substring(2);
                if (localDigits === dbWithoutCountry) return true;
              }
              
              if (localNumber.startsWith('+91') && localDigits.length >= 12) {
                const localWithoutCountry = localDigits.substring(2);
                if (dbDigits === localWithoutCountry) return true;
              }
              
              if (dbDigits.startsWith('91') && localDigits.startsWith('91')) {
                const dbMain = dbDigits.substring(2);
                const localMain = localDigits.substring(2);
                if (dbMain === localMain) return true;
              }
              
              return false;
            })) {
              return true;
            }
            
            const userEmail = registeredUser.email;
            if (userEmail && emailAddresses.some(email => 
              email.email.toLowerCase() === userEmail.toLowerCase()
            )) {
              return true;
            }
            
            return false;
          });

          return {
            recordID: contact.recordID,
            displayName: contact.displayName,
            phoneNumbers: contact.phoneNumbers || [],
            emailAddresses: contact.emailAddresses || [],
            thumbnailPath: contact.thumbnailPath,
            isRegistered: true,
            userId: matchingUser?.uid || null,
            userInfo: matchingUser || null,
          };
        })
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
      
      console.log('✅ Filtered', filteredContacts.length, 'matching contacts');
      setContacts(filteredContacts);
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
      
      // Retry logic for transient errors
      if (retryCount < 2) {
        console.log(`🔄 Retrying contacts load... attempt ${retryCount + 1}`);
        setTimeout(() => {
          loadContacts(retryCount + 1);
        }, 2000);
        return;
      }
      
      Alert.alert(
        'Error Loading Contacts', 
        'Failed to load contacts. Please check permissions and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => loadContacts(0) }
        ]
      );
    } finally {
      setContactsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setGroupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectMember = (contact) => {
    const isSelected = selectedMembers.find(member => member.recordID === contact.recordID);
    
    if (isSelected) {
      setSelectedMembers(prev => prev.filter(member => member.recordID !== contact.recordID));
    } else {
      setSelectedMembers(prev => [...prev, contact]);
    }
  };

  const handleUploadCoverImage = () => {
    // Simply open the image picker - it will handle permissions internally
    openImagePicker();
  };

  const openImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setGroupData(prev => ({
          ...prev,
          coverImage: asset.uri,
        }));
      }
    });
  };

  const handleSave = async () => {
    if (!groupData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      let coverImageUrl = null;
      
      // Upload cover image if selected
      if (groupData.coverImage) {
        const groupId = `group_${Date.now()}`;
        coverImageUrl = await firebaseService.uploadGroupCoverImage(groupData.coverImage, groupId);
      }

      // Extract member user IDs for Firebase
      const memberUserIds = selectedMembers
        .map(member => member.userId)
        .filter(userId => userId && typeof userId === 'string' && userId.trim() !== '');
      
      console.log('Selected members for group creation:', selectedMembers);
      console.log('Extracted member user IDs:', memberUserIds);
      
      // Prepare group data for Firebase
      const groupDataForFirebase = {
        name: groupData.name.trim(),
        description: groupData.description.trim(),
        coverImageUrl,
        members: memberUserIds, // Pass user IDs instead of contact objects
      };

      // Create group in Firebase
      const newGroup = await firebaseService.createGroup(groupDataForFirebase);
      
      Alert.alert('Success', 'Group created successfully!');
      
      if (onSave) {
        onSave(newGroup);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Group</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cover Image Upload */}
        <View style={styles.coverImageSection}>
          <TouchableOpacity style={styles.coverImageContainer} onPress={handleUploadCoverImage}>
            {groupData.coverImage ? (
              <Image source={{ uri: groupData.coverImage }} style={styles.coverImage} />
            ) : (
              <>
                <View style={styles.uploadIcon}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.uploadText}>Upload cover image</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Group Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            value={groupData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Trip to Busan 🚗"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Group Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={groupData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Add short description"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Add Members Section */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Add Members</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Person or Phone Number"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <View style={styles.selectedMembersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedMembers.map((member) => (
                  <TouchableOpacity
                    key={member.recordID}
                    style={styles.selectedMember}
                    onPress={() => handleSelectMember(member)}
                  >
                    <Image
                      source={{
                        uri: member.thumbnailPath || 'https://via.placeholder.com/50x50/333/fff?text=' + member.displayName.charAt(0)
                      }}
                      style={styles.selectedMemberImage}
                    />
                    <View style={styles.removeIcon}>
                      <Text style={styles.removeIconText}>×</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Contacts Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.suggestedTitle}>Add Registered Friends</Text>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={() => {
                console.log('🔄 Manual refresh triggered');
                setContacts([]);
                setRegisteredUsers([]);
                initializeData();
              }}
              disabled={contactsLoading || registeredUsersLoading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={contactsLoading || registeredUsersLoading ? theme.colors.textMuted : theme.colors.primary} 
              />
            </TouchableOpacity>
          </View>
          
          {registeredUsersLoading ? (
            <View style={styles.skeletonContainer}>
              {[...Array(6)].map((_, index) => (
                <View key={index} style={styles.skeletonItem}>
                  <View style={styles.skeletonAvatar} />
                  <View style={styles.skeletonContent}>
                    <View style={styles.skeletonName} />
                    <View style={styles.skeletonPhone} />
                  </View>
                  <View style={styles.skeletonButton} />
                </View>
              ))}
            </View>
          ) : !hasContactsPermission ? (
            <View style={styles.permissionContainer}>
              <Ionicons name="person-add" size={48} color="#9CA3AF" />
              <Text style={styles.permissionText}>Contact access required</Text>
              <Text style={styles.permissionSubtext}>Allow access to find your registered friends</Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestContactsPermission}>
                <Text style={styles.permissionButtonText}>Allow Access</Text>
              </TouchableOpacity>
            </View>
          ) : contactsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Finding registered friends...</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.noContactsContainer}>
              <Ionicons name="people" size={48} color="#9CA3AF" />
              <Text style={styles.noContactsText}>No registered friends found</Text>
              <Text style={styles.noContactsSubtext}>
                {searchQuery ? 'Try different search terms' : 'None of your contacts are registered users yet'}
              </Text>
            </View>
          ) : (
            filteredContacts.map((contact) => (
              <TouchableOpacity
                key={contact.recordID}
                style={styles.contactItem}
                onPress={() => handleSelectMember(contact)}
              >
                <View style={styles.contactImageContainer}>
                  {contact.thumbnailPath ? (
                    <Image
                      source={{ uri: contact.thumbnailPath }}
                      style={styles.contactImage}
                    />
                  ) : (
                    <View style={styles.contactImagePlaceholder}>
                      <Text style={styles.contactImagePlaceholderText}>
                        {contact.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.displayName}</Text>
                  {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                    <Text style={styles.contactPhone}>{contact.phoneNumbers[0].number}</Text>
                  )}
                  <View style={styles.registeredBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={styles.registeredText}>Registered User</Text>
                  </View>
                </View>
                {selectedMembers.find(member => member.recordID === contact.recordID) && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  coverImageSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  coverImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  uploadText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  coverImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  inputGroup: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  membersSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.borderLight,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  selectedMembersContainer: {
    marginBottom: 16,
  },
  selectedMember: {
    position: 'relative',
    marginRight: 12,
  },
  selectedMemberImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  removeIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIconText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  contactImageContainer: {
    marginRight: 12,
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  contactImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactImagePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  contactPhone: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  registeredText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: 16,
    marginVertical: 24,
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
  permissionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
  },
  permissionSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  noContactsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noContactsText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  noContactsSubtext: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  addMemberForm: {
    backgroundColor: theme.colors.borderLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  memberInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Skeleton Loading Styles
  skeletonContainer: {
    paddingVertical: 8,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.borderLight,
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 4,
  },
  skeletonName: {
    height: 16,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  skeletonPhone: {
    height: 12,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 4,
    width: '50%',
  },
  skeletonButton: {
    width: 60,
    height: 30,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 15,
  },
  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
});

export default CreateNewGroupScreen;
