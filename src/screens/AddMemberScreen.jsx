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
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Contacts from 'react-native-contacts';
import firebaseService from '../services/firebaseService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AddMemberScreen = ({route, navigation}) => {
  const {group} = route.params || {};
  const {theme} = useTheme();
  const {user} = useAuth();

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [hasContactsPermission, setHasContactsPermission] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [registeredUsersLoading, setRegisteredUsersLoading] = useState(true);
  const [existingMembers, setExistingMembers] = useState([]);

  useEffect(() => {
    initializeData();
  }, []);

  // Watch for registered users to load and trigger contact loading
  useEffect(() => {
    if (
      registeredUsers.length > 0 &&
      hasContactsPermission &&
      !contactsLoading &&
      contacts.length === 0
    ) {
      console.log('Registered users loaded, triggering contact loading...');
      loadContacts(0);
    }
  }, [registeredUsers, hasContactsPermission]);

  const initializeData = async () => {
    try {
      console.log('🚀 Initializing AddMemberScreen data...');

      // Load existing group members first
      await loadExistingMembers();

      // Then load registered users and request permissions
      await loadRegisteredUsers();
      await requestContactsPermission();

      console.log('✅ Initialization complete');
    } catch (error) {
      console.error('❌ Error initializing data:', error);
    }
  };

  const loadExistingMembers = async () => {
    if (!group?.id) {
      console.log('No group ID provided');
      return;
    }

    try {
      console.log('📋 Loading existing group members...');
      const members = await firebaseService.getGroupMembersWithProfiles(
        group.id,
      );
      console.log('✅ Loaded existing members:', members);
      setExistingMembers(members);
    } catch (error) {
      console.error('❌ Error loading existing members:', error);
    }
  };

  const loadRegisteredUsers = async (retryCount = 0) => {
    setRegisteredUsersLoading(true);
    try {
      console.log('📋 Loading registered users from Firebase...');

      // Get all registered users from Firebase
      const usersSnapshot = await firebaseService.firestore
        .collection('users')
        .get();
      const users = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }));

      console.log('✅ Loaded', users.length, 'registered users from Firebase');
      setRegisteredUsers(users);
    } catch (error) {
      console.error('❌ Error loading registered users:', error);

      // Retry logic for network issues
      if (retryCount < 2) {
        console.log(
          `🔄 Retrying registered users load... attempt ${retryCount + 1}`,
        );
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
      } else {
        console.log('❌ Contacts permission denied');
        setHasContactsPermission(false);
        Alert.alert(
          'Permission Required',
          'Please allow access to contacts to add members from your registered friends.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Allow Access', onPress: () => requestContactsPermission()},
          ],
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
        console.log(
          '❌ No registered users available yet, cannot filter contacts',
        );
        setContactsLoading(false);
        return;
      }

      console.log(
        '📱 Loading contacts with',
        registeredUsers.length,
        'registered users',
      );
      const contactsList = await Contacts.getAll();
      console.log('📱 Loaded', contactsList.length, 'local contacts');

      // Get existing member IDs to filter them out
      const existingMemberIds = existingMembers.map(member => member.userId);
      console.log('👥 Existing member IDs:', existingMemberIds);

      // Filter contacts to show only registered users who are NOT already in the group
      const filteredContacts = contactsList
        .filter(contact => {
          if (!contact.displayName || contact.displayName.trim() === '')
            return false;

          // Check if any phone number or email matches a registered user
          const phoneNumbers = contact.phoneNumbers || [];
          const emailAddresses = contact.emailAddresses || [];

          return registeredUsers.some(registeredUser => {
            // Exclude current user from contacts list
            if (user && registeredUser.uid === user.uid) {
              return false;
            }

            // Exclude users who are already group members
            if (existingMemberIds.includes(registeredUser.uid)) {
              return false;
            }

            // Check phone numbers with improved matching
            const userPhone = registeredUser.phoneNumber;
            if (
              userPhone &&
              phoneNumbers.some(phone => {
                const localNumber = phone.number.trim();
                const dbNumber = userPhone.trim();

                // Normalize both numbers (remove all non-digits)
                const localDigits = localNumber.replace(/\D/g, '');
                const dbDigits = dbNumber.replace(/\D/g, '');

                // Various matching cases
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
              })
            ) {
              return true;
            }

            // Check email addresses
            const userEmail = registeredUser.email;
            if (
              userEmail &&
              emailAddresses.some(
                email => email.email.toLowerCase() === userEmail.toLowerCase(),
              )
            ) {
              return true;
            }

            return false;
          });
        })
        .map(contact => {
          // Find the matching registered user info
          const matchingUser = registeredUsers.find(registeredUser => {
            // Exclude current user and existing members
            if (user && registeredUser.uid === user.uid) return false;
            if (existingMemberIds.includes(registeredUser.uid)) return false;

            const phoneNumbers = contact.phoneNumbers || [];
            const emailAddresses = contact.emailAddresses || [];

            const userPhone = registeredUser.phoneNumber;
            if (
              userPhone &&
              phoneNumbers.some(phone => {
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
              })
            ) {
              return true;
            }

            const userEmail = registeredUser.email;
            if (
              userEmail &&
              emailAddresses.some(
                email => email.email.toLowerCase() === userEmail.toLowerCase(),
              )
            ) {
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

      console.log(
        '✅ Filtered',
        filteredContacts.length,
        'new contacts to add',
      );
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
          {text: 'Cancel', style: 'cancel'},
          {text: 'Retry', onPress: () => loadContacts(0)},
        ],
      );
    } finally {
      setContactsLoading(false);
    }
  };

  const handleSelectMember = contact => {
    const isSelected = selectedMembers.find(
      member => member.recordID === contact.recordID,
    );

    if (isSelected) {
      setSelectedMembers(prev =>
        prev.filter(member => member.recordID !== contact.recordID),
      );
    } else {
      setSelectedMembers(prev => [...prev, contact]);
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please select at least one member to add');
      return;
    }

    setLoading(true);
    try {
      // Extract member user IDs for Firebase
      const memberUserIds = selectedMembers
        .map(member => member.userId)
        .filter(
          userId =>
            userId && typeof userId === 'string' && userId.trim() !== '',
        );

      console.log('Adding members to group:', memberUserIds);

      // Add members to the group
      await firebaseService.addMembersToGroup(group.id, memberUserIds);

      Alert.alert(
        'Success',
        `${selectedMembers.length} member(s) added successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to GroupDetail and trigger refresh
              navigation.navigate('GroupDetail', {
                group: {...group},
                reload: true,
                timestamp: Date.now(),
              });
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Error', 'Failed to add members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Members</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Group Info */}
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group?.name}</Text>
          <Text style={styles.groupDescription}>
            Add new members to this group
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Person or Phone Number"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <View style={styles.selectedMembersContainer}>
            <Text style={styles.sectionTitle}>
              Selected ({selectedMembers.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedMembers.map(member => (
                <TouchableOpacity
                  key={member.recordID}
                  style={styles.selectedMember}
                  onPress={() => handleSelectMember(member)}>
                  <Image
                    source={{
                      uri:
                        member.thumbnailPath ||
                        'https://via.placeholder.com/50x50/333/fff?text=' +
                          member.displayName.charAt(0),
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

        {/* Available Contacts Section */}
        <View style={styles.contactsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Friends</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                console.log('🔄 Manual refresh triggered');
                setContacts([]);
                setRegisteredUsers([]);
                initializeData();
              }}
              disabled={contactsLoading || registeredUsersLoading}>
              <Ionicons
                name="refresh"
                size={20}
                color={
                  contactsLoading || registeredUsersLoading
                    ? theme.colors.textMuted
                    : theme.colors.primary
                }
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
              <Ionicons
                name="person-add"
                size={48}
                color={theme.colors.textMuted}
              />
              <Text style={styles.permissionText}>Contact access required</Text>
              <Text style={styles.permissionSubtext}>
                Allow access to find your registered friends
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestContactsPermission}>
                <Text style={styles.permissionButtonText}>Allow Access</Text>
              </TouchableOpacity>
            </View>
          ) : contactsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>
                Finding registered friends...
              </Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.noContactsContainer}>
              <Ionicons
                name="people"
                size={48}
                color={theme.colors.textMuted}
              />
              <Text style={styles.noContactsText}>No new friends to add</Text>
              <Text style={styles.noContactsSubtext}>
                {searchQuery
                  ? 'Try different search terms'
                  : 'All your registered friends are already in this group'}
              </Text>
            </View>
          ) : (
            filteredContacts.map(contact => (
              <TouchableOpacity
                key={contact.recordID}
                style={styles.contactItem}
                onPress={() => handleSelectMember(contact)}>
                <View style={styles.contactImageContainer}>
                  {contact.thumbnailPath ? (
                    <Image
                      source={{uri: contact.thumbnailPath}}
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
                    <Text style={styles.contactPhone}>
                      {contact.phoneNumbers[0].number}
                    </Text>
                  )}
                  <View style={styles.registeredBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color="#10B981"
                    />
                    <Text style={styles.registeredText}>Registered User</Text>
                  </View>
                </View>
                {selectedMembers.find(
                  member => member.recordID === contact.recordID,
                ) && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Button */}
      {selectedMembers.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddMembers}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>
                Add {selectedMembers.length} Member
                {selectedMembers.length > 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
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
    groupInfo: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    groupName: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    groupDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.borderLight,
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
      margin: 16,
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
      paddingHorizontal: 16,
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
    contactsSection: {
      paddingHorizontal: 16,
      paddingBottom: 100, // Space for floating button
    },
    sectionTitle: {
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
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    addButtonDisabled: {
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

export default AddMemberScreen;
