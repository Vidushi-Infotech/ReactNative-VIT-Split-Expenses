import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { spacing, fontSizes, getColorWithOpacity } from '../../theme/theme';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import GroupService from '../../services/GroupService';
import UserService from '../../services/UserService';
import ContactService from '../../services/ContactService';
import NotificationService from '../../services/NotificationService';
import PermissionService from '../../services/PermissionService';
import {
  checkPermission,
  requestPermission,
  isPermissionGranted,
  openAppSettings,
} from '../../utils/permissionsManager';

const GroupMembersScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors: themeColors, isDarkMode } = useTheme();
  const { userProfile } = useAuth();

  // Get group data from route params
  const { group } = route.params || {};

  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingDeviceContacts, setIsLoadingDeviceContacts] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isCurrentUserMember, setIsCurrentUserMember] = useState(false);

  // Load group members and device contacts on mount
  useEffect(() => {
    if (group && group.id) {
      // First load group members, then check contacts permission
      const initializeScreen = async () => {
        try {
          console.log('=== INITIALIZING GROUP MEMBERS SCREEN ===');
          // First load group members
          await loadGroupMembers();
          // Then check contacts permission and load device contacts
          await checkContactsPermission();
          console.log('=== INITIALIZATION COMPLETE ===');
        } catch (error) {
          console.error('Error initializing screen:', error);
        }
      };

      initializeScreen();
    } else {
      Alert.alert('Error', 'Group information is missing');
      navigation.goBack();
    }
  }, [group]);

  // Load group members
  const loadGroupMembers = async () => {
    try {
      setIsLoadingMembers(true);

      // Get the latest group data to ensure we have the most up-to-date members list
      const updatedGroup = await GroupService.getGroupById(group.id);

      if (!updatedGroup || !updatedGroup.members) {
        throw new Error('Failed to load group data');
      }

      // Fetch user details for all members
      const memberPromises = updatedGroup.members.map(async (memberId) => {
        try {
          const userData = await UserService.getUserById(memberId);
          return {
            ...userData,
            isCurrentUser: memberId === userProfile?.id
          };
        } catch (error) {
          console.error(`Error fetching user ${memberId}:`, error);
          return {
            id: memberId,
            name: 'Unknown User',
            isCurrentUser: memberId === userProfile?.id
          };
        }
      });

      const memberDetails = await Promise.all(memberPromises);
      setGroupMembers(memberDetails);

      // Check if the current user is the admin (creator) of the group
      const isAdmin = userProfile?.id === updatedGroup.createdBy;
      setIsCurrentUserAdmin(isAdmin);
      console.log(`Current user is ${isAdmin ? 'admin' : 'not admin'} of this group`);

      // Check if the current user is a member of the group
      const isMember = updatedGroup.members.includes(userProfile?.id);
      setIsCurrentUserMember(isMember);
      console.log(`Current user is ${isMember ? 'a member' : 'not a member'} of this group`);

      // After updating group members, also update the device contacts list
      // to ensure we're not showing any existing members in the suggestions
      if (deviceContacts.length > 0) {
        const filteredContacts = deviceContacts.filter(contact => {
          // Check if this contact is already a member of the group
          const isExistingMember = memberDetails.some(member => {
            // Check by ID
            if (member.id === contact.id) {
              console.log(`Filtering out contact by ID match: ${contact.name} (${contact.id}) matches member ${member.name} (${member.id})`);
              return true;
            }

            // Check by phone number if both have phone numbers
            if (member.phoneNumber && contact.phoneNumber) {
              // Clean both phone numbers (remove any non-digit characters)
              const cleanMemberPhone = member.phoneNumber.replace(/\D/g, '');
              const cleanContactPhone = contact.phoneNumber.replace(/\D/g, '');

              // Check if the full numbers match
              if (cleanMemberPhone === cleanContactPhone) {
                console.log(`Filtering out contact by exact phone match: ${contact.name} (${contact.phoneNumber}) matches member ${member.name} (${member.phoneNumber})`);
                return true;
              }

              // Check if the last 10 digits match (to handle country code differences)
              if (cleanMemberPhone.length >= 10 && cleanContactPhone.length >= 10) {
                const memberLastDigits = cleanMemberPhone.slice(-10);
                const contactLastDigits = cleanContactPhone.slice(-10);

                if (memberLastDigits === contactLastDigits) {
                  console.log(`Filtering out contact by last 10 digits match: ${contact.name} (${contact.phoneNumber}) matches member ${member.name} (${member.phoneNumber})`);
                  return true;
                }
              }

              // Check if one number contains the other (for partial matches)
              if (cleanMemberPhone.includes(cleanContactPhone) || cleanContactPhone.includes(cleanMemberPhone)) {
                console.log(`Filtering out contact by partial phone match: ${contact.name} (${contact.phoneNumber}) matches member ${member.name} (${member.phoneNumber})`);
                return true;
              }
            }

            return false;
          });

          return !isExistingMember;
        });

        console.log(`Filtered device contacts: ${filteredContacts.length} out of ${deviceContacts.length}`);
        setDeviceContacts(filteredContacts);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
      Alert.alert('Error', 'Failed to load group members');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Check contacts permission and load device contacts if granted
  const checkContactsPermission = async () => {
    try {
      console.log('=== CHECKING CONTACTS PERMISSION ===');
      console.log('Group members already loaded:', groupMembers.map(m => `${m.name} (${m.id})`));
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
        // Always reload group members to ensure we have the most up-to-date list
        console.log('Reloading group members to ensure we have the latest data...');
        await loadGroupMembers();

        // Load device contacts if the current user is either an admin or a member
        if (isCurrentUserAdmin || isCurrentUserMember) {
          console.log('Current user is admin or member, loading device contacts...');
          await loadDeviceContacts();
        } else {
          console.log('Current user is neither admin nor member, skipping device contacts loading');
          setIsLoadingDeviceContacts(false);
        }
      } else {
        console.log('Permission denied, showing alert...');
        Alert.alert(
          'Permission Required',
          'To add contacts from your device, please allow access to your contacts.',
          [
            {text: 'Cancel', style: 'cancel'},
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
        'There was an error checking contacts permission.'
      );
    }
  };

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
          'No contacts were found on your device or permission might not be properly granted.'
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

      // Get current group members for filtering
      console.log('Current group members:', groupMembers.map(m => `${m.name} (${m.id}, ${m.phoneNumber || 'no phone'})`));

      // Filter out users who are already members of the group
      const filteredContacts = [];

      for (const contact of processedContacts) {
        let isAlreadyMember = false;

        // Check against each group member
        for (const member of groupMembers) {
          // Check by ID
          if (member.id === contact.id) {
            console.log(`Filtering out contact by ID match: ${contact.name} (${contact.id}) matches member ${member.name} (${member.id})`);
            isAlreadyMember = true;
            break;
          }

          // Check by phone number if both have phone numbers
          if (member.phoneNumber && contact.phoneNumber) {
            // Clean both phone numbers (remove any non-digit characters)
            const cleanMemberPhone = member.phoneNumber.replace(/\D/g, '');
            const cleanContactPhone = contact.phoneNumber.replace(/\D/g, '');

            // Check if the full numbers match
            if (cleanMemberPhone === cleanContactPhone) {
              console.log(`Filtering out contact by exact phone match: ${contact.name} (${contact.phoneNumber}) matches member ${member.name} (${member.phoneNumber})`);
              isAlreadyMember = true;
              break;
            }

            // Check if the last 10 digits match (to handle country code differences)
            if (cleanMemberPhone.length >= 10 && cleanContactPhone.length >= 10) {
              const memberLastDigits = cleanMemberPhone.slice(-10);
              const contactLastDigits = cleanContactPhone.slice(-10);

              if (memberLastDigits === contactLastDigits) {
                console.log(`Filtering out contact by last 10 digits match: ${contact.name} (${contact.phoneNumber}) matches member ${member.name} (${member.phoneNumber})`);
                isAlreadyMember = true;
                break;
              }
            }

            // Check if one number contains the other (for partial matches)
            if (cleanMemberPhone.includes(cleanContactPhone) || cleanContactPhone.includes(cleanMemberPhone)) {
              console.log(`Filtering out contact by partial phone match: ${contact.name} (${contact.phoneNumber}) matches member ${member.name} (${member.phoneNumber})`);
              isAlreadyMember = true;
              break;
            }
          }
        }

        // Add to filtered list only if not already a member
        if (!isAlreadyMember) {
          filteredContacts.push(contact);
        }
      }

      console.log(
        `Filtered out existing members, ${filteredContacts.length} contacts remaining out of ${processedContacts.length}`,
      );

      if (filteredContacts.length > 0) {
        console.log('First few filtered contacts:', filteredContacts.slice(0, 3).map(c => `${c.name} (${c.id}, ${c.phoneNumber || 'no phone'})`));
      }

      // Set the device contacts (only those that are app users, excluding current user and existing members)
      setDeviceContacts(filteredContacts);
      console.log('Registered device contacts set successfully');

      // Log the first few contacts for debugging
      if (filteredContacts.length > 0) {
        console.log('First few contacts in suggested list:');
        filteredContacts.slice(0, Math.min(5, filteredContacts.length)).forEach(contact => {
          console.log(`- ${contact.name} (${contact.id}, ${contact.phoneNumber || 'no phone'})`);
        });
      }
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

    // Filter by phone number with more thorough matching
    return deviceContacts.filter(contact => {
      if (!contact.phoneNumber) return false;

      // Clean the contact phone number
      const cleanContactPhone = contact.phoneNumber.replace(/\D/g, '');

      // Check if the clean contact phone contains the clean search query
      if (cleanContactPhone.includes(cleanSearchQuery)) {
        return true;
      }

      // Check if the last digits match (for partial searches)
      if (cleanSearchQuery.length >= 3 && cleanContactPhone.length >= cleanSearchQuery.length) {
        const contactLastDigits = cleanContactPhone.slice(-cleanSearchQuery.length);
        if (contactLastDigits === cleanSearchQuery) {
          return true;
        }
      }

      return false;
    });
  };

  const filteredContacts = getFilteredContacts();

  // Debug log to help identify any issues with the filtering process
  useEffect(() => {
    if (deviceContacts.length > 0 && groupMembers.length > 0) {
      console.log('=== FILTERING DEBUG ===');
      console.log(`Group has ${groupMembers.length} members`);
      console.log(`Device contacts list has ${deviceContacts.length} contacts`);

      // Check if any device contacts should have been filtered out
      const shouldBeFiltered = deviceContacts.filter(contact => {
        return groupMembers.some(member => {
          // Check by ID
          if (member.id === contact.id) {
            console.log(`WARNING: Contact ${contact.name} (${contact.id}) should be filtered out by ID but is still in device contacts`);
            return true;
          }

          // Check by phone number
          if (member.phoneNumber && contact.phoneNumber) {
            const cleanMemberPhone = member.phoneNumber.replace(/\D/g, '');
            const cleanContactPhone = contact.phoneNumber.replace(/\D/g, '');

            // Check last 10 digits
            if (cleanMemberPhone.length >= 10 && cleanContactPhone.length >= 10) {
              const memberLastDigits = cleanMemberPhone.slice(-10);
              const contactLastDigits = cleanContactPhone.slice(-10);

              if (memberLastDigits === contactLastDigits) {
                console.log(`WARNING: Contact ${contact.name} (${contact.phoneNumber}) should be filtered out by phone match with member ${member.name} (${member.phoneNumber}) but is still in device contacts`);
                return true;
              }
            }
          }

          return false;
        });
      });

      if (shouldBeFiltered.length > 0) {
        console.log(`WARNING: Found ${shouldBeFiltered.length} contacts that should have been filtered out`);
      } else {
        console.log('Filtering is working correctly - no group members found in device contacts list');
      }
      console.log('=== END FILTERING DEBUG ===');
    }
  }, [deviceContacts, groupMembers]);

  // Handle selecting a user to add to the group
  const handleSelectUser = user => {
    if (selectedUsers.some(selectedUser => selectedUser.id === user.id)) {
      setSelectedUsers(
        selectedUsers.filter(selectedUser => selectedUser.id !== user.id),
      );
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  // Handle removing a member from the group
  const handleRemoveMember = async (memberId, memberName) => {
    // Check if the current user is the admin
    if (!isCurrentUserAdmin) {
      Alert.alert('Access Denied', 'Only the group admin can remove members from this group.');
      return;
    }

    // Don't allow removing the admin (self)
    if (memberId === userProfile?.id) {
      Alert.alert('Error', 'You cannot remove yourself from the group as you are the admin.');
      return;
    }

    // Confirm before removing
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this group?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`Removing member ${memberId} (${memberName}) from group ${group.id}`);

              // Remove the member from the group
              await GroupService.removeMemberFromGroup(group.id, memberId);

              // Reload the group members to reflect the changes
              await loadGroupMembers();

              // Show success message
              Alert.alert('Success', `${memberName} has been removed from the group.`);
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member from the group. Please try again.');
            }
          },
        },
      ],
    );
  };

  // Handle adding selected members to the group
  const handleAddMembers = async () => {
    // Check if the current user is either an admin or a member
    if (!isCurrentUserAdmin && !isCurrentUserMember) {
      Alert.alert('Access Denied', 'You need to be a member of this group to add new members.');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one member to add.');
      return;
    }

    setIsAddingMembers(true);

    try {
      console.log('=== ADDING MEMBERS TO GROUP ===');
      console.log(`Adding ${selectedUsers.length} members to group ${group.id}`);

      // Get the IDs of the selected users
      const newMemberIds = selectedUsers.map(user => user.id);
      console.log('New member IDs:', newMemberIds);

      // Add the new members to the group
      await GroupService.addMembersToGroup(group.id, newMemberIds);

      // Send notifications to all new members
      for (const userId of newMemberIds) {
        try {
          await NotificationService.createGroupInviteNotification(
            userId,
            group.name,
            userProfile.name || 'A user',
            group.id
          );
          console.log(`Sent group invitation notification to user ${userId}`);
        } catch (notifError) {
          console.error(`Error sending notification to user ${userId}:`, notifError);
          // Continue with other notifications even if one fails
        }
      }

      console.log('Reloading group members after adding new members...');
      // Reload the group members to reflect the changes
      await loadGroupMembers();

      // Clear the selected users
      setSelectedUsers([]);

      console.log('Updating device contacts list to remove newly added members...');
      console.log('Selected users to remove:', selectedUsers.map(u => `${u.name} (${u.id}, ${u.phoneNumber || 'no phone'})`));

      // Instead of manually filtering, let's reload the device contacts to ensure we have the most up-to-date list
      // This will automatically filter out any members that were just added to the group
      await loadDeviceContacts();

      console.log('Device contacts reloaded and filtered automatically');

      Alert.alert('Success', 'Members added successfully');
      console.log('=== MEMBERS ADDED SUCCESSFULLY ===');
    } catch (error) {
      console.error('Error adding members to group:', error);
      Alert.alert('Error', 'Failed to add members to the group. Please try again.');
    } finally {
      setIsAddingMembers(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Group Members
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Members Section */}
          <Animated.View entering={FadeInUp.duration(800)}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Current Members ({groupMembers.length})
            </Text>

            {isLoadingMembers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={themeColors.primary.default} />
                <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                  Loading members...
                </Text>
              </View>
            ) : (
              <View style={styles.membersList}>
                {groupMembers.map((member, index) => (
                  <View
                    key={`member-${member.id}-${index}`}
                    style={[
                      styles.memberItem,
                      { backgroundColor: themeColors.surface }
                    ]}
                  >
                    <View style={styles.memberInfo}>
                      <Avatar
                        source={member.avatar}
                        name={member.name || 'User'}
                        size="sm"
                      />
                      <View style={styles.memberTextContainer}>
                        <Text style={[styles.memberName, { color: themeColors.text }]}>
                          {member.isCurrentUser ? 'Me' : member.name || 'Unknown User'}
                        </Text>
                        {member.phoneNumber && (
                          <Text style={[styles.memberPhone, { color: themeColors.textSecondary }]}>
                            {member.phoneNumber}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.memberActions}>
                      {member.id === group.createdBy && (
                        <View style={[styles.adminBadge, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.2) }]}>
                          <Text style={[styles.adminText, { color: themeColors.primary.default }]}>
                            Admin
                          </Text>
                        </View>
                      )}

                      {/* Remove button - only visible to admin and not for the admin themselves */}
                      {isCurrentUserAdmin && member.id !== group.createdBy && (
                        <TouchableOpacity
                          style={[styles.removeButton, { backgroundColor: getColorWithOpacity(themeColors.danger, 0.1) }]}
                          onPress={() => handleRemoveMember(member.id, member.name || 'Unknown User')}
                        >
                          <Icon name="person-remove-outline" size={18} color={themeColors.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Add Members Section - Visible to both admin and members */}
          {(isCurrentUserAdmin || isCurrentUserMember) ? (
            <Animated.View entering={FadeInUp.duration(800).delay(200)}>
              <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: spacing.xl }]}>
                Add Members
              </Text>

              <View style={[styles.searchContainer, { backgroundColor: themeColors.surface }]}>
                <Icon
                  name="call-outline"
                  size={20}
                  color={themeColors.textSecondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.searchInput, { color: themeColors.text }]}
                  placeholder="Search by phone number"
                  placeholderTextColor={themeColors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  keyboardType="phone-pad"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}
                  >
                    <Icon name="close-circle" size={20} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {selectedUsers.length > 0 && (
                <View style={styles.selectedUsersContainer}>
                  <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
                    Selected ({selectedUsers.length})
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.selectedUsersScroll}
                  >
                    {selectedUsers.map((user, index) => (
                      <View
                        key={`selected-${user.id}-${index}`}
                        style={styles.selectedUserItem}
                      >
                        <View style={styles.avatarContainer}>
                          <Avatar source={user.avatar} name={user.name} size="md" />
                          <TouchableOpacity
                            onPress={() => handleSelectUser(user)}
                            style={[
                              styles.removeUserButton,
                              { backgroundColor: themeColors.danger },
                            ]}
                          >
                            <Icon name="close" size={12} color={themeColors.white} />
                          </TouchableOpacity>
                        </View>
                        <Text
                          style={[styles.selectedUserName, { color: themeColors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {user.name.split(' ')[0]}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>

                  <Button
                    title={`Add ${selectedUsers.length} Member${selectedUsers.length > 1 ? 's' : ''}`}
                    onPress={handleAddMembers}
                    loading={isAddingMembers}
                    fullWidth
                    size="md"
                    style={styles.addButton}
                  />
                </View>
              )}

              {/* Suggested Contacts */}
              <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary, marginTop: spacing.lg }]}>
                Suggested Contacts
              </Text>

              {isLoadingDeviceContacts ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={themeColors.primary.default} />
                  <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
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
                  <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                    No app users found in your contacts
                  </Text>
                  <Text style={[styles.emptySubText, { color: themeColors.textSecondary }]}>
                    We only show contacts who are already using the app
                  </Text>
                  <TouchableOpacity
                    style={[styles.refreshButton, { backgroundColor: themeColors.primary.default }]}
                    onPress={checkContactsPermission}
                  >
                    <Text style={styles.refreshButtonText}>Refresh Contacts</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredContacts.length === 0 ? (
                <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
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
                      style={[styles.userItem, { backgroundColor }]}
                    >
                      <Avatar
                        source={contact.avatar}
                        name={contact.name}
                        size="sm"
                      />

                      <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: themeColors.text }]}>
                          {contact.name}
                        </Text>
                        <Text
                          style={[styles.userUsername, { color: themeColors.textSecondary }]}
                        >
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
                          name="add-circle-outline"
                          size={24}
                          color={themeColors.primary.default}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(800).delay(200)}>
              <View style={styles.nonAdminMessageContainer}>
                <Icon
                  name="lock-closed-outline"
                  size={40}
                  color={themeColors.textSecondary}
                />
                <Text style={[styles.nonAdminMessageTitle, { color: themeColors.text }]}>
                  Not a Group Member
                </Text>
                <Text style={[styles.nonAdminMessageText, { color: themeColors.textSecondary }]}>
                  You need to be a member of this group to add new members.
                </Text>
              </View>
            </Animated.View>
          )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  headerRight: {
    width: 40, // To balance the header
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
  },
  membersList: {
    marginBottom: spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  memberName: {
    fontWeight: '500',
    fontSize: fontSizes.md,
  },
  memberPhone: {
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  adminBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  adminText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  removeButton: {
    padding: spacing.xs,
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: fontSizes.md,
  },
  clearButton: {
    padding: spacing.xs,
  },
  selectedUsersContainer: {
    marginBottom: spacing.lg,
  },
  selectedUsersScroll: {
    flexDirection: 'row',
    marginBottom: spacing.md,
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
    maxWidth: 60,
    textAlign: 'center',
  },
  addButton: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
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
  nonAdminMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.xl,
  },
  nonAdminMessageTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  nonAdminMessageText: {
    fontSize: fontSizes.md,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});

export default GroupMembersScreen;
