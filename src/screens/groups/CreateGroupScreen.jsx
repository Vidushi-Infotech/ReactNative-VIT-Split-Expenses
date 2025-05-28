import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {FadeInUp} from 'react-native-reanimated';
import {spacing, fontSizes} from '../../theme/theme';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import {launchImageLibrary} from 'react-native-image-picker';
import GroupService from '../../services/GroupService';
import UserService from '../../services/UserService';
import ContactService from '../../services/ContactService';
import NotificationService from '../../services/NotificationService'; // Import the ContactService instead of direct Contacts
import PermissionService from '../../services/PermissionService'; // Import the PermissionService
// Import fallback permission functions in case PermissionService is not available
import {
  checkPermission,
  requestPermission,
  isPermissionGranted,
  openAppSettings,
} from '../../utils/permissionsManager';

const CreateGroupScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupImage, setGroupImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [isLoadingDeviceContacts, setIsLoadingDeviceContacts] = useState(false);

  // New state variables for the member type selection
  const [memberType, setMemberType] = useState('individual'); // 'individual' or 'group'
  const [selectedContact, setSelectedContact] = useState(null); // For group mode
  const [additionalMembersCount, setAdditionalMembersCount] = useState(''); // For group mode
  const [groupModalVisible, setGroupModalVisible] = useState(false); // For group mode modal
  const [groupMembers, setGroupMembers] = useState([]); // For storing group members

  const navigation = useNavigation();
  const {colors: themeColors} = useTheme();
  const {userProfile} = useAuth();

  // Helper function to get color with opacity
  const getColorWithOpacity = (color, opacity) => {
    // Convert hex to rgba
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  };

  // Load device contacts on mount
  useEffect(() => {
    // Check contacts permission and load device contacts if granted
    checkContactsPermission();
  }, []);

  // Check contacts permission and load device contacts if granted
  const checkContactsPermission = async () => {
    try {
      console.log('=== CHECKING CONTACTS PERMISSION ===');
      console.log('Platform:', Platform.OS, Platform.Version);
      let isGranted = false;

      // Try using PermissionService first
      if (
        PermissionService &&
        typeof PermissionService.checkAndRequestPermission === 'function'
      ) {
        console.log('Using PermissionService.checkAndRequestPermission');
        isGranted = await PermissionService.checkAndRequestPermission(
          'contacts',
        );
        console.log('PermissionService result:', isGranted);
      } else {
        // Fallback to direct permission functions
        console.log('Falling back to direct permission functions');
        // Check if permission is already granted
        const status = await checkPermission('contacts');
        console.log('Permission status:', status);

        if (isPermissionGranted(status)) {
          console.log('Permission already granted');
          isGranted = true;
        } else {
          // Request permission
          console.log('Requesting permission...');
          const result = await requestPermission('contacts');
          console.log('Permission request result:', result);
          isGranted = isPermissionGranted(result);
          console.log('Is permission granted:', isGranted);
        }
      }

      if (isGranted) {
        console.log('Permission granted, loading contacts...');
        loadDeviceContacts();
      } else {
        console.log('Permission denied, showing alert...');
        Alert.alert(
          'Permission Required',
          'To add contacts from your device, please allow access to your contacts.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Debug',
              onPress: () => navigation.navigate('DeviceContactsDebug'),
            },
            {
              text: 'Open Settings',
              onPress: PermissionService?.openSettings || openAppSettings,
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error checking contacts permission:', error);
      Alert.alert(
        'Error',
        'There was an error checking contacts permission. Would you like to try the debug screen?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Debug Contacts',
            onPress: () => navigation.navigate('DeviceContactsDebug'),
          },
        ],
      );
    }
  };

  // We no longer need to load all users from the database
  // as we're only showing device contacts that are app users

  // Load contacts from the device
  const loadDeviceContacts = async () => {
    try {
      console.log('=== LOADING DEVICE CONTACTS ===');
      setIsLoadingDeviceContacts(true);

      // Get all contacts from the device using ContactService
      console.log('Getting contacts using ContactService.getAllContacts()');
      const contacts = await ContactService.getAllContacts();
      console.log(`Retrieved ${contacts.length} contacts from ContactService`);

      if (contacts.length === 0) {
        console.log('No contacts returned from ContactService');
        Alert.alert(
          'No Contacts Found',
          'No contacts were found on your device or permission might not be properly granted.',
          [
            {text: 'OK'},
            {
              text: 'Debug',
              onPress: () => navigation.navigate('DeviceContactsDebug'),
            },
          ],
        );
        setDeviceContacts([]);
        return;
      }

      // Get all app users to match with device contacts
      console.log('Getting all app users to match with device contacts...');
      const appUsers = await UserService.getAllUsers();
      console.log(`Retrieved ${appUsers.length} app users`);

      // Find device contacts that are also app users (excluding the current user)
      console.log(
        'Finding registered contacts (device contacts that are also app users)...',
      );
      console.log(
        'Current user:',
        userProfile
          ? `${userProfile.name} (${userProfile.phoneNumber})`
          : 'Not available',
      );
      const registeredContacts = ContactService.findRegisteredContacts(
        contacts,
        appUsers,
        userProfile,
      );
      console.log(
        `Found ${registeredContacts.length} registered contacts (excluding current user)`,
      );

      // Format the registered contacts for the UI
      console.log('Processing registered contacts for UI...');
      const processedContacts = registeredContacts.map((contact, index) => {
        // Prioritize app user data over contact data
        return {
          id: contact.appUserId || contact.contactId || `contact-${index}-${Date.now()}`,
          name: contact.name,
          phoneNumber: contact.primaryPhoneClean || contact.phoneNumber,
          isAppUser: true, // These are app users
          // Use avatar from app database for profile photo
          avatar: contact.avatar || null, // App user's avatar from database
          // Add a unique key to prevent duplicate key warnings
          uniqueKey: `${contact.appUserId || contact.contactId || contact.phoneNumber}-${index}`,
        };
      });

      console.log(
        `Processed ${processedContacts.length} registered contacts for the UI`,
      );

      // Filter out the current user from the device contacts
      const filteredContacts = processedContacts.filter(contact => {
        // Check if this contact is the current user
        if (
          userProfile &&
          (contact.id === userProfile.id ||
            contact.phoneNumber === userProfile.phoneNumber)
        ) {
          console.log(
            `Filtering out current user from device contacts: ${contact.name}`,
          );
          return false;
        }
        return true;
      });

      console.log(
        `Filtered out current user, ${filteredContacts.length} contacts remaining`,
      );

      // Set the device contacts (only those that are app users, excluding current user)
      setDeviceContacts(filteredContacts);
      console.log('Registered device contacts set successfully');
    } catch (error) {
      console.error('Error loading device contacts:', error);
      Alert.alert(
        'Error',
        'Failed to load device contacts. Please try again.',
      );
    } finally {
      setIsLoadingDeviceContacts(false);
      console.log('=== DEVICE CONTACTS LOADING COMPLETE ===');
    }
  };

  // Filter contacts based on phone number search query
  const getFilteredContacts = () => {
    if (!searchQuery.trim()) {
      // If no search query, return all device contacts
      return deviceContacts;
    }

    // Clean the search query (remove non-numeric characters)
    const cleanSearchQuery = searchQuery.replace(/\D/g, '');

    // Only filter by phone number
    return deviceContacts.filter(
      contact =>
        contact.phoneNumber && contact.phoneNumber.includes(cleanSearchQuery),
    );
  };

  const filteredContacts = getFilteredContacts();

  const handleSelectUser = user => {
    if (memberType === 'individual') {
      // Individual mode - toggle selection
      if (selectedUsers.some(selectedUser => selectedUser.id === user.id)) {
        setSelectedUsers(
          selectedUsers.filter(selectedUser => selectedUser.id !== user.id),
        );
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    } else {
      // Group mode - open modal for adding additional members
      setSelectedContact(user);
      setAdditionalMembersCount('');
      setGroupModalVisible(true);
    }
  };

  const handleAddGroup = () => {
    if (!selectedContact) return;

    // Validate additional members count
    const count = parseInt(additionalMembersCount);

    if (isNaN(count) || count <= 0) {
      Alert.alert('Error', 'Please enter a valid number of additional members (at least 1)');
      return;
    }

    // Add the group to groupMembers
    setGroupMembers([
      ...groupMembers,
      {
        contact: selectedContact,
        additionalMembersCount: count
      }
    ]);

    // Close the modal
    setGroupModalVisible(false);
    setSelectedContact(null);
    setAdditionalMembersCount('');
  };



  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.assets && result.assets.length > 0) {
        setGroupImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleCreateGroup = async () => {
    // Validate based on member type
    if (memberType === 'individual') {
      if (!groupName.trim() || selectedUsers.length === 0) {
        Alert.alert(
          'Error',
          'Please enter a group name and add at least one member.',
        );
        return;
      }
    } else { // Group mode
      if (!groupName.trim() || groupMembers.length === 0) {
        Alert.alert(
          'Error',
          'Please enter a group name and add at least one group.',
        );
        return;
      }
    }

    setLoading(true);

    try {
      let appUserIds = [];
      let invitedContacts = [];

      if (memberType === 'individual') {
        // Individual mode - just use selected users
        appUserIds = selectedUsers.map(user => user.id);
      } else {
        // Group mode - collect all app users from groups
        groupMembers.forEach(group => {
          // Add the main contact (who is an app user)
          appUserIds.push(group.contact.id);

          // Store the additional members count in the group metadata
          // These members don't need to join the app and don't have phone numbers
          // The group member (contact) will manage payments for their additional members, not the main account holder
        });
      }

      // Prepare group data
      const groupData = {
        name: groupName.trim(),
        image: groupImage,
        createdBy: userProfile.id,
        members: [userProfile.id, ...appUserIds],
        invitedContacts: [],
        // Add group metadata for additional members
        groupMetadata: memberType === 'group' ? {
          type: 'group',
          groups: groupMembers.map(group => ({
            contactId: group.contact.id,
            contactName: group.contact.name,
            additionalMembersCount: group.additionalMembersCount
          }))
        } : {
          type: 'individual'
        }
      };

      // Create the group in Firestore
      const groupId = await GroupService.createGroup(groupData);

      // Send notifications to all members except the creator
      for (const userId of appUserIds) {
        try {
          await NotificationService.createGroupInviteNotification(
            userId,
            groupName.trim(),
            userProfile.name || 'A user',
            groupId
          );
          console.log(`Sent group invitation notification to user ${userId}`);
        } catch (notifError) {
          console.error(`Error sending notification to user ${userId}:`, notifError);
          // Continue with other notifications even if one fails
        }
      }

      // Navigate back to the main tab navigator
      navigation.navigate('Main');
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <ScrollView
        style={[styles.container, {backgroundColor: themeColors.background}]}
        contentContainerStyle={styles.contentContainer}>
        <Animated.View
          style={styles.photoContainer}
          entering={FadeInUp.duration(800)}>
          <TouchableOpacity
            onPress={handleSelectImage}
            style={styles.photoButton}>
            {groupImage ? (
              <Image source={{uri: groupImage}} style={styles.groupImage} />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  {backgroundColor: themeColors.surface},
                ]}>
                <Icon
                  name="image-outline"
                  size={40}
                  color={themeColors.textSecondary}
                />
              </View>
            )}

            <View
              style={[
                styles.cameraButton,
                {backgroundColor: themeColors.primary.default},
              ]}>
              <Icon name="camera-outline" size={16} color={themeColors.white} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.photoText, {color: themeColors.textSecondary}]}>
            Add Group Photo
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(800).delay(100)}>
          <Input
            label="Group Name"
            placeholder="Enter group name"
            value={groupName}
            onChangeText={setGroupName}
            leftIcon={
              <Icon
                name="people-outline"
                size={20}
                color={themeColors.textSecondary}
              />
            }
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(800).delay(200)}>
          <Text style={[styles.sectionTitle, {color: themeColors.text}]}>
            Add Members
          </Text>

          {/* Member Type Selection */}
          <View style={styles.memberTypeContainer}>
            <TouchableOpacity
              style={[
                styles.memberTypeButton,
                memberType === 'individual' && {
                  backgroundColor: themeColors.primary.light + '30',
                  borderColor: themeColors.primary.default,
                },
              ]}
              onPress={() => setMemberType('individual')}>
              <Icon
                name="person-outline"
                size={20}
                color={
                  memberType === 'individual'
                    ? themeColors.primary.default
                    : themeColors.textSecondary
                }
              />
              <Text
                style={[
                  styles.memberTypeText,
                  {
                    color:
                      memberType === 'individual'
                        ? themeColors.primary.default
                        : themeColors.textSecondary,
                  },
                ]}>
                Individual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.memberTypeButton,
                memberType === 'group' && {
                  backgroundColor: themeColors.primary.light + '30',
                  borderColor: themeColors.primary.default,
                },
              ]}
              onPress={() => setMemberType('group')}>
              <Icon
                name="people-outline"
                size={20}
                color={
                  memberType === 'group'
                    ? themeColors.primary.default
                    : themeColors.textSecondary
                }
              />
              <Text
                style={[
                  styles.memberTypeText,
                  {
                    color:
                      memberType === 'group'
                        ? themeColors.primary.default
                        : themeColors.textSecondary,
                  },
                ]}>
                Group
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            placeholder="Search by phone number"
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType="phone-pad"
            leftIcon={
              <Icon
                name="call-outline"
                size={20}
                color={themeColors.textSecondary}
              />
            }
          />

          {memberType === 'group' && groupMembers.length > 0 && (
            <View style={styles.groupMembersContainer}>
              <Text style={[styles.groupMembersTitle, {color: themeColors.textSecondary}]}>
                Group Members
              </Text>
              {groupMembers.map((group, index) => (
                <View key={`group-${index}`} style={[styles.groupItem, {backgroundColor: themeColors.surface}]}>
                  <View style={styles.groupItemHeader}>
                    <Avatar
                      source={group.contact.avatar}
                      name={group.contact.name}
                      size="sm"
                    />
                    <Text style={[styles.groupItemName, {color: themeColors.text}]}>
                      {group.contact.name}'s Group
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        // Remove this group
                        setGroupMembers(groupMembers.filter((_, i) => i !== index));
                      }}>
                      <Icon name="close-circle" size={20} color={themeColors.danger} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.groupItemMembers}>
                    <View style={styles.groupItemMembersInfo}>
                      <Icon
                        name="person-outline"
                        size={14}
                        color={themeColors.textSecondary}
                      />
                      <Text style={[styles.groupItemMembersText, {color: themeColors.textSecondary}]}>
                        {group.additionalMembersCount + 1}
                      </Text>
                    </View>
                    <View style={styles.groupItemMembersInfo}>
                      <Icon
                        name="people-outline"
                        size={14}
                        color={themeColors.textSecondary}
                      />
                      <Text style={[styles.groupItemMembersText, {color: themeColors.textSecondary}]}>
                        {group.additionalMembersCount}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {selectedUsers.length > 0 && (
          <Animated.View
            style={styles.selectedUsersContainer}
            entering={FadeInUp.duration(800).delay(300)}>
            <Text
              style={[
                styles.sectionSubtitle,
                {color: themeColors.textSecondary},
              ]}>
              Selected ({selectedUsers.length})
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.selectedUsersScroll}>
              {selectedUsers.map((user, index) => (
                <View
                  key={`selected-${user.id}-${index}`}
                  style={styles.selectedUserItem}>
                  <View style={styles.avatarContainer}>
                    <Avatar source={user.avatar} name={user.name} size="md" />
                    <TouchableOpacity
                      onPress={() => handleSelectUser(user)}
                      style={[
                        styles.removeUserButton,
                        {backgroundColor: themeColors.danger},
                      ]}>
                      <Icon name="close" size={12} color={themeColors.white} />
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[
                      styles.selectedUserName,
                      {color: themeColors.textSecondary},
                    ]}
                    numberOfLines={1}>
                    {user.name.split(' ')[0]}
                  </Text>

                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(800).delay(400)}>
          <Text style={[styles.sectionTitle, {color: themeColors.text}]}>
            Suggested Contacts
          </Text>

          {/* Show device contacts that are app users */}
          {isLoadingDeviceContacts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={themeColors.primary.default}
              />
              <Text
                style={[
                  styles.loadingText,
                  {color: themeColors.textSecondary},
                ]}>
                Finding app users in your contacts...
              </Text>
            </View>
          ) : deviceContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon
                name="people-outline"
                size={40}
                color={themeColors.textSecondary}
              />
              <Text
                style={[styles.emptyText, {color: themeColors.textSecondary}]}>
                No app users found in your contacts
              </Text>
              <Text
                style={[
                  styles.emptySubText,
                  {color: themeColors.textSecondary},
                ]}>
                We only show contacts who are already using the app (excluding
                yourself)
              </Text>
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  {backgroundColor: themeColors.primary.default},
                ]}
                onPress={checkContactsPermission}>
                <Text style={styles.refreshButtonText}>Refresh Contacts</Text>
              </TouchableOpacity>
            </View>
          ) : filteredContacts.length === 0 ? (
            <Text
              style={[styles.emptyText, {color: themeColors.textSecondary}]}>
              No user found with this phone number
            </Text>
          ) : (
            filteredContacts.map((contact, index) => {
              const isSelected = selectedUsers.some(
                selectedUser => selectedUser.id === contact.id,
              );
              const backgroundColor = isSelected
                ? getColorWithOpacity(themeColors.primary.default, 0.15) // 15% opacity
                : themeColors.surface;

              return (
                <TouchableOpacity
                  key={contact.uniqueKey || `contact-${contact.id}-${index}`}
                  onPress={() => handleSelectUser(contact)}
                  style={[styles.userItem, {backgroundColor}]}>
                  <Avatar
                    source={contact.avatar}
                    name={contact.name}
                    size="sm"
                  />

                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, {color: themeColors.text}]}>
                      {contact.name}
                    </Text>
                    <Text
                      style={[
                        styles.userUsername,
                        {color: themeColors.textSecondary},
                      ]}>
                      {contact.phoneNumber}
                    </Text>
                  </View>

                  {isSelected ? (
                    <Icon
                      name="checkmark-circle"
                      size={24}
                      color={themeColors.primary.default}
                    />
                  ) : (
                    <Icon
                      name="person"
                      size={20}
                      color={themeColors.primary.default}
                    />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </Animated.View>

        <Animated.View
          style={styles.buttonContainer}
          entering={FadeInUp.duration(800).delay(500)}>
          <Button
            title="Create Group"
            onPress={handleCreateGroup}
            loading={loading}
            disabled={!groupName.trim() || selectedUsers.length === 0}
            fullWidth
            size="lg"
          />
        </Animated.View>
      </ScrollView>

      {/* Group Modal */}
      <Modal
        visible={groupModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGroupModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Add Group Members
              </Text>
              <TouchableOpacity onPress={() => setGroupModalVisible(false)}>
                <Icon name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedContact && (
              <View style={styles.selectedContactContainer}>
                <Avatar
                  source={selectedContact.avatar}
                  name={selectedContact.name}
                  size="md"
                />
                <View style={styles.selectedContactInfo}>
                  <Text style={[styles.selectedContactName, { color: themeColors.text }]}>
                    {selectedContact.name}
                  </Text>
                  <Text style={[styles.selectedContactPhone, { color: themeColors.textSecondary }]}>
                    {selectedContact.phoneNumber}
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.modalLabel, { color: themeColors.textSecondary }]}>
              Number of additional members in this group
            </Text>
            <TextInput
              style={[
                styles.additionalNumbersInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border
                }
              ]}
              value={additionalMembersCount}
              onChangeText={setAdditionalMembersCount}
              placeholder="e.g. 3"
              placeholderTextColor={themeColors.placeholder}
              keyboardType="number-pad"
            />

            <View style={styles.spacer} />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: themeColors.background }]}
                onPress={() => setGroupModalVisible(false)}>
                <Text style={[styles.modalButtonText, { color: themeColors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: themeColors.primary.default }]}
                onPress={handleAddGroup}>
                <Text style={[styles.modalButtonText, { color: themeColors.white }]}>
                  Add Group
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  memberTypeContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    justifyContent: 'space-between',
  },
  memberTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 0.48,
  },
  memberTypeText: {
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  groupMembersContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  groupMembersTitle: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
  },
  groupItem: {
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  groupItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItemName: {
    flex: 1,
    marginLeft: spacing.md,
    fontWeight: '500',
  },
  groupItemMembers: {
    marginTop: spacing.sm,
    marginLeft: 40, // Align with the name
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItemMembersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  groupItemMembersText: {
    fontSize: fontSizes.sm,
    marginLeft: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg, // Account for bottom safe area on iOS
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  selectedContactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  selectedContactInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  selectedContactName: {
    fontWeight: '600',
    fontSize: fontSizes.md,
  },
  selectedContactPhone: {
    fontSize: fontSizes.sm,
  },
  modalLabel: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
  },
  additionalNumbersInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSizes.md,
    textAlign: 'center',
  },

  spacer: {
    height: spacing.xl, // Add a larger space
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalButtonText: {
    fontWeight: '600',
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoButton: {
    position: 'relative',
  },
  groupImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  imagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 9999,
    padding: spacing.sm,
  },
  photoText: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  selectedUsersContainer: {
    marginBottom: spacing.lg,
  },
  selectedUsersScroll: {
    flexDirection: 'row',
  },
  selectedUserItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  removeUserButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 9999,
    padding: spacing.xs,
  },
  selectedUserName: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },

  // Removed tab styles as we no longer need tabs
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  emptySubText: {
    textAlign: 'center',
    paddingBottom: spacing.lg,
    fontSize: fontSizes.sm,
    opacity: 0.8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  refreshButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontWeight: '500',
  },
  userUsername: {
    fontSize: fontSizes.sm,
  },

  buttonContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});

export default CreateGroupScreen;
