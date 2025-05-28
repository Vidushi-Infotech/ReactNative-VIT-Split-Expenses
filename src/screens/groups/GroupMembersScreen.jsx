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
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupMemberCount, setGroupMemberCount] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupContacts, setGroupContacts] = useState([]);
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

      // Separate individual members and groups
      let individualMembers = [...memberDetails];
      let groupMembers = [];

      console.log('=== DETAILED GROUP DATA DEBUG ===');
      console.log('Group metadata:', JSON.stringify(updatedGroup.groupMetadata, null, 2));

      if (updatedGroup.groupMetadata && updatedGroup.groupMetadata.groups && updatedGroup.groupMetadata.groups.length > 0) {
        console.log(`Found ${updatedGroup.groupMetadata.groups.length} groups in metadata`);

        // Get regular members (not part of any group)
        individualMembers = memberDetails.filter(member => {
          // Check if this member is not a primary contact for any group
          return !updatedGroup.groupMetadata.groups.some(g => g.primaryContact === member.id);
        });

        // Get group members
        groupMembers = updatedGroup.groupMetadata.groups.map((groupInfo, index) => {
          console.log(`Processing group ${index + 1}:`, JSON.stringify(groupInfo, null, 2));

          // Find the primary contact user
          const primaryContact = memberDetails.find(m => m.id === groupInfo.primaryContact);
          if (primaryContact) {
            console.log(`Found primary contact for group ${index + 1}:`, primaryContact.name);
            return {
              ...primaryContact,
              isGroupPrimary: true,
              groupName: groupInfo.name || primaryContact.name,
              groupMembersCount: groupInfo.members ? groupInfo.members.length : 0,
              groupInfo: groupInfo
            };
          } else {
            console.log(`Could not find primary contact for group ${index + 1} with ID:`, groupInfo.primaryContact);
            // If we can't find the primary contact in the members list, create a placeholder
            // Use fixed contact names for testing
            const contactNames = ["Vit User", "Shubham Hingne", "Shoaib A."];
            const phoneNumbers = ["9307088228", "7798580975", "7744847294"];
            const contactIndex = index % contactNames.length;

            return {
              id: groupInfo.primaryContact || `group-${index}`,
              name: contactNames[contactIndex],
              isGroupPrimary: true,
              groupName: contactNames[contactIndex],
              phoneNumber: phoneNumbers[contactIndex],
              groupMembersCount: 3, // Fixed value for consistency
              groupInfo: groupInfo
            };
          }
        });

        console.log(`Processed ${groupMembers.length} groups`);
      } else if (updatedGroup.groupMetadata) {
        console.log('Group has metadata but no groups array or empty groups array');
      } else {
        console.log('Group has no metadata');
      }

      console.log('=== END DETAILED GROUP DATA DEBUG ===');

      // Store both individual members and group members separately
      setGroupMembers(individualMembers);

      // Debug log to check group data
      console.log('=== GROUP DATA DEBUG ===');
      console.log('Group metadata:', updatedGroup.groupMetadata);
      if (updatedGroup.groupMetadata && updatedGroup.groupMetadata.groups) {
        console.log('Number of groups:', updatedGroup.groupMetadata.groups.length);
        console.log('Groups:', JSON.stringify(updatedGroup.groupMetadata.groups, null, 2));
      }
      console.log('Individual members:', individualMembers.length);
      console.log('Group members:', groupMembers.length);
      console.log('=== END GROUP DATA DEBUG ===');

      // Check for groupCount in different possible locations
      const groupCount = updatedGroup.groupMetadata && updatedGroup.groupMetadata.groups ?
                        updatedGroup.groupMetadata.groups.length :
                        (updatedGroup.groupCount ||
                        (updatedGroup.groupMetadata && updatedGroup.groupMetadata.groupCount) ||
                        (updatedGroup.metadata && updatedGroup.metadata.groupCount) || 0);

      console.log('Detected group count:', groupCount);

      // If we have actual group data from metadata, use it
      if (updatedGroup.groupMetadata && updatedGroup.groupMetadata.groups && updatedGroup.groupMetadata.groups.length > 0) {
        console.log('Using actual group data from metadata');

        // Make sure we have the correct number of groups
        if (groupMembers.length !== updatedGroup.groupMetadata.groups.length) {
          console.log(`Group members array (${groupMembers.length}) doesn't match metadata groups (${updatedGroup.groupMetadata.groups.length})`);

          // Rebuild the group members array from metadata
          groupMembers = updatedGroup.groupMetadata.groups.map((groupInfo, index) => {
            // Find the primary contact user if possible
            const primaryContact = memberDetails.find(m => m.id === groupInfo.primaryContact);

            if (primaryContact) {
              return {
                ...primaryContact,
                id: groupInfo.primaryContact,
                isGroupPrimary: true,
                groupName: groupInfo.name || primaryContact.name,
                name: `${groupInfo.name || primaryContact.name} + ${groupInfo.memberCount || 0}`,
                phoneNumber: groupInfo.phoneNumber || primaryContact.phoneNumber,
                groupMembersCount: groupInfo.memberCount || 0,
                groupInfo: groupInfo
              };
            } else {
              // If we can't find the primary contact, use the data from metadata
              return {
                id: groupInfo.primaryContact || `group-${index}`,
                name: `${groupInfo.name || 'Contact'} + ${groupInfo.memberCount || 0}`,
                isGroupPrimary: true,
                groupName: groupInfo.name || 'Contact',
                phoneNumber: groupInfo.phoneNumber || '',
                groupMembersCount: groupInfo.memberCount || 0,
                groupInfo: groupInfo
              };
            }
          });
        }

        // Store group information in the state
        setGroupContacts(groupMembers);
      }
      // If we have no groups but metadata indicates there should be some, create placeholders
      else if (groupCount > 0 && groupMembers.length === 0) {
        console.log(`Creating ${groupCount} placeholder group contacts based on metadata`);

        const placeholderGroups = [];
        // Create fixed placeholder contacts for testing
        const contactNames = ["Vit User", "Shubham Hingne", "Shoaib A."];
        const phoneNumbers = ["9307088228", "7798580975", "7744847294"];

        for (let i = 0; i < groupCount; i++) {
          // Use fixed contact data
          const contactIndex = i % contactNames.length;
          const contactName = contactNames[contactIndex];
          const phoneNumber = phoneNumbers[contactIndex];

          const placeholderGroup = {
            id: `placeholder-group-${Date.now()}-${i}`,
            name: `${contactName} + 3`,
            isGroupPrimary: true,
            groupName: contactName,
            phoneNumber: phoneNumber,
            groupMembersCount: 3, // Fixed value for consistency
            isPlaceholder: true
          };
          placeholderGroups.push(placeholderGroup);
        }

        setGroupContacts(placeholderGroups);
        console.log(`Added ${groupCount} placeholder groups`);
      }
      // Otherwise, just use the group members we already processed
      else {
        console.log(`Using ${groupMembers.length} processed group members`);
        setGroupContacts(groupMembers);
      }

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
        const allMembers = [...individualMembers, ...groupMembers];

        const filteredContacts = deviceContacts.filter(contact => {
          // Check if this contact is already a member of the group
          const isExistingMember = allMembers.some(member => {
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
    if (deviceContacts.length > 0 && (groupMembers.length > 0 || groupContacts.length > 0)) {
      console.log('=== FILTERING DEBUG ===');
      console.log(`Group has ${groupMembers.length} individual members and ${groupContacts.length} group contacts`);
      console.log(`Device contacts list has ${deviceContacts.length} contacts`);

      const allMembers = [...groupMembers, ...groupContacts];

      // Check if any device contacts should have been filtered out
      const shouldBeFiltered = deviceContacts.filter(contact => {
        return allMembers.some(member => {
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
  }, [deviceContacts, groupMembers, groupContacts]);

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

  // Handle removing a member or group from the group
  const handleRemoveMember = async (memberId, memberName, isGroup = false) => {
    // Check if the current user is the admin
    if (!isCurrentUserAdmin) {
      Alert.alert('Access Denied', 'Only the group admin can remove members from this group.');
      return;
    }

    // Don't allow removing the admin (self) if it's a member (not a group)
    if (!isGroup && memberId === userProfile?.id) {
      Alert.alert('Error', 'You cannot remove yourself from the group as you are the admin.');
      return;
    }

    // Confirm before removing
    Alert.alert(
      isGroup ? 'Remove Group' : 'Remove Member',
      `Are you sure you want to remove ${memberName} ${isGroup ? 'group' : ''} from this group?`,
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
              console.log(`Removing ${isGroup ? 'group' : 'member'} ${memberId} (${memberName}) from group ${group.id}`);

              if (isGroup) {
                // For groups, we'll handle it by removing the group from metadata
                console.log(`Removing group with ID: ${memberId} and name: ${memberName}`);

                // Find the group in the metadata to get the primaryContact ID
                const groupMetadata = group.groupMetadata || {};
                const groups = groupMetadata.groups || [];

                // Log all groups for debugging
                console.log('All groups in metadata:', JSON.stringify(groups, null, 2));

                // Find the index of the group in the UI list
                const groupIndex = groupContacts.findIndex(g => g.id === memberId);
                console.log(`Group index in UI list: ${groupIndex}`);

                if (groupIndex === -1) {
                  console.error(`Group with ID ${memberId} not found in UI list`);
                  Alert.alert('Error', 'Group not found in the list. Please try again.');
                  return;
                }

                // Get the group from the UI list
                const groupToRemove = groupContacts[groupIndex];
                console.log('Group to remove from UI:', JSON.stringify(groupToRemove, null, 2));

                // Use the index to remove the group from the metadata
                try {
                  // Use the dedicated method to remove a group from metadata
                  const success = await GroupService.removeGroupFromMetadata(group.id, groupIndex);

                  if (success) {
                    console.log('Successfully removed group from metadata');

                    // Get the updated group data
                    const updatedGroup = await GroupService.getGroupById(group.id);
                    if (updatedGroup) {
                      // Update the local group reference
                      group.groupMetadata = updatedGroup.groupMetadata;
                    }

                    // Reload the group members to reflect the changes
                    await loadGroupMembers();

                    // Show success message
                    Alert.alert('Success', `${memberName}'s group has been removed from the group.`);
                  } else {
                    throw new Error('Failed to remove group from metadata');
                  }
                } catch (error) {
                  console.error('Error removing group:', error);
                  Alert.alert('Error', 'Failed to remove group. Please try again.');
                }
              } else {
                // Remove the member from the group
                await GroupService.removeMemberFromGroup(group.id, memberId);

                // Reload the group members to reflect the changes
                await loadGroupMembers();

                // Show success message
                Alert.alert('Success', `${memberName} has been removed from the group.`);
              }
            } catch (error) {
              console.error(`Error removing ${isGroup ? 'group' : 'member'}:`, error);
              Alert.alert('Error', `Failed to remove ${isGroup ? 'group' : 'member'} from the group. Please try again.`);
            }
          },
        },
      ],
    );
  };

  // Function to add a test group for debugging
  const addTestGroup = () => {
    // Show options to add individual members or groups
    Alert.alert(
      'Add to Group',
      'Would you like to add individual members or a group?',
      [
        {
          text: 'Individual Members',
          onPress: () => {
            // Navigate to the add members screen
            navigation.navigate('AddGroupMembers', {
              groupId: group.id,
              currentMembers: [...individualMembers, ...groupMembers],
            });
          },
        },
        {
          text: 'Add Group',
          onPress: () => {
            // Handle adding a group
            handleAddGroup();
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Handle adding a group to the group
  const handleAddGroup = async (members = []) => {
    try {
      if (members.length === 0) {
        Alert.alert('Error', 'Please add at least one contact with number of persons');
        return;
      }

      setIsAddingMembers(true);

      // Get the contact information
      const contact = members[0];
      const contactName = contact.name || 'Contact';
      const phoneNumber = contact.phoneNumber;
      const memberCount = contact.groupMembersCount || 1;

      // Try to get the contact name from the device contacts
      const matchingContact = deviceContacts.find(dc =>
        dc.phoneNumber && dc.phoneNumber.replace(/\D/g, '').includes(phoneNumber.replace(/\D/g, ''))
      );

      const displayName = matchingContact ? matchingContact.name : contactName;

      // Generate a unique ID for the group
      const groupId = `group-${Date.now()}`;

      // Create a new group
      const newGroup = {
        id: groupId,
        name: `${displayName} + ${memberCount}`,
        isGroupPrimary: true,
        groupName: displayName,
        phoneNumber: phoneNumber,
        groupMembersCount: memberCount,
      };

      // Add to group contacts
      setGroupContacts(prevContacts => [...prevContacts, newGroup]);

      // Update the group count in the group metadata
      const updatedGroupCount = (groupContacts.length || 0) + 1;

      // Get the current group metadata
      const currentMetadata = group.groupMetadata || {};

      // Create a new group metadata entry
      const newGroupMetadata = {
        primaryContact: groupId,
        name: displayName,
        phoneNumber: phoneNumber,
        memberCount: memberCount,
        members: [phoneNumber], // Primary contact
      };

      // Update the groups array in the metadata
      const updatedGroups = currentMetadata.groups ?
        [...currentMetadata.groups, newGroupMetadata] :
        [newGroupMetadata];

      // Create updated metadata object
      const updatedMetadata = {
        ...currentMetadata,
        groups: updatedGroups,
        groupCount: updatedGroupCount
      };

      // Update the group metadata in the database
      const success = await GroupService.updateGroupMetadata(group.id, updatedMetadata);

      if (success) {
        console.log('Successfully updated group metadata in the database');

        // Update the local group state with the updated metadata
        const updatedGroup = await GroupService.getGroupById(group.id);
        if (updatedGroup) {
          console.log('Successfully retrieved updated group from database');

          // Update the group reference to ensure it has the latest metadata
          group.groupMetadata = updatedMetadata;

          // Reload the group members to reflect the changes
          await loadGroupMembers();
        } else {
          console.error('Failed to retrieve updated group from database');
        }
      } else {
        console.error('Failed to update group metadata in the database');
      }

      console.log(`Added new group with ${memberCount} members. Total groups: ${updatedGroupCount}`);
      Alert.alert('Group Added', `${displayName} + ${memberCount} has been added to the group.`);

      // Clear the selected users
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error adding group:', error);
      Alert.alert('Error', 'Failed to add group. Please try again.');
    } finally {
      setIsAddingMembers(false);
    }
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

  // Debug log for render
  console.log('=== RENDER DEBUG ===');
  console.log('Group members count:', groupMembers.length);
  console.log('Group contacts count:', groupContacts.length);
  console.log('=== END RENDER DEBUG ===');

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
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={addTestGroup}
            >
              <Icon name="add-circle-outline" size={24} color={themeColors.primary.default} />
            </TouchableOpacity>
          </View>
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

          {/* Groups Section - Always show for testing */}
          <Animated.View entering={FadeInUp.duration(800).delay(100)}>
            <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: spacing.xl }]}>
              Groups ({groupContacts.length})
            </Text>

            {isLoadingMembers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={themeColors.primary.default} />
                <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                  Loading groups...
                </Text>
              </View>
            ) : groupContacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon
                  name="people-outline"
                  size={40}
                  color={themeColors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                  No groups found
                </Text>
                <Text style={[styles.emptySubText, { color: themeColors.textSecondary }]}>
                  This group doesn't have any sub-groups yet
                </Text>
              </View>
            ) : (
              <View style={styles.membersList}>
                {groupContacts.map((groupContact, index) => (
                  <View
                    key={`group-${groupContact.id}-${index}`}
                    style={[
                      styles.memberItem,
                      { backgroundColor: themeColors.surface }
                    ]}
                  >
                    <View style={styles.memberInfo}>
                      <Avatar
                        source={groupContact.avatar}
                        name={groupContact.groupName || groupContact.name || 'Group'}
                        size="sm"
                      />
                      <View style={styles.memberTextContainer}>
                        <View style={styles.groupNameContainer}>
                          <Text style={[styles.memberName, { color: themeColors.text }]}>
                            {groupContact.name || 'Unknown Contact'}
                          </Text>
                          <Text style={[styles.groupMembersCountText, { color: themeColors.textSecondary }]}>
                            + <Text style={styles.groupMembersCountNumber}>{groupContact.groupMembersCount || 3}</Text>
                          </Text>
                        </View>
                        {groupContact.phoneNumber && (
                          <Text style={[styles.memberPhone, { color: themeColors.textSecondary }]}>
                            {groupContact.phoneNumber}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.memberActions}>
                      {groupContact.id === group.createdBy && (
                        <View style={[styles.adminBadge, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.2) }]}>
                          <Text style={[styles.adminText, { color: themeColors.primary.default }]}>
                            Admin
                          </Text>
                        </View>
                      )}

                      {/* Remove button - only visible to admin for groups */}
                      {isCurrentUserAdmin && (
                        <TouchableOpacity
                          style={[styles.removeButton, { backgroundColor: getColorWithOpacity(themeColors.danger, 0.1) }]}
                          onPress={() => handleRemoveMember(groupContact.id, groupContact.name || 'Unknown Group', true)}
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

              {/* Add Group Section */}
              <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: spacing.xl }]}>
                Add Group
              </Text>

              <View style={[styles.addGroupContainer, { backgroundColor: themeColors.surface }]}>
                <View style={styles.addGroupHeader}>
                  <Icon name="people" size={24} color={themeColors.primary.default} />
                  <Text style={[styles.addGroupTitle, { color: themeColors.text }]}>Create a new group</Text>
                </View>

                <View style={styles.addGroupInputContainer}>
                  <TextInput
                    style={[styles.addGroupInput, { color: themeColors.text, borderColor: themeColors.border }]}
                    placeholder="Enter phone number"
                    placeholderTextColor={themeColors.textSecondary}
                    keyboardType="phone-pad"
                    value={groupSearchQuery}
                    onChangeText={setGroupSearchQuery}
                  />

                  <TextInput
                    style={[styles.addGroupCountInput, { color: themeColors.text, borderColor: themeColors.border }]}
                    placeholder="Person Count"
                    placeholderTextColor={themeColors.textSecondary}
                    keyboardType="number-pad"
                    value={groupMemberCount}
                    onChangeText={setGroupMemberCount}
                  />

                  <TouchableOpacity
                    style={[styles.addGroupMemberButton, { backgroundColor: getColorWithOpacity(themeColors.primary.default, 0.1) }]}
                    onPress={() => {
                      if (groupSearchQuery.trim().length > 0) {
                        // Validate member count
                        const count = parseInt(groupMemberCount) || 0;
                        if (count <= 0) {
                          Alert.alert('Error', 'Please enter a valid number of persons (greater than 0)');
                          return;
                        }

                        // Try to find a matching contact in device contacts
                        const matchingContact = deviceContacts.find(dc =>
                          dc.phoneNumber && dc.phoneNumber.replace(/\D/g, '').includes(groupSearchQuery.trim().replace(/\D/g, ''))
                        );

                        const contactName = matchingContact ? matchingContact.name : 'Contact';

                        // Add the number to the group
                        const newMember = {
                          id: `temp-${Date.now()}`,
                          name: `${contactName} + ${count}`,
                          phoneNumber: groupSearchQuery.trim(),
                          groupMembersCount: count
                        };

                        // Add to selected users
                        setSelectedUsers([newMember]); // Replace any existing selection

                        // Clear the search query
                        setGroupSearchQuery('');
                        setGroupMemberCount('');
                      } else {
                        Alert.alert('Error', 'Please enter a valid phone number');
                      }
                    }}
                  >
                    <Icon name="add" size={20} color={themeColors.primary.default} />
                    <Text style={[styles.addGroupMemberButtonText, { color: themeColors.primary.default }]}>Add</Text>
                  </TouchableOpacity>
                </View>

                {selectedUsers.length > 0 && (
                  <View style={styles.groupMembersPreview}>
                    <Text style={[styles.groupMembersPreviewTitle, { color: themeColors.textSecondary }]}>
                      Group Members ({selectedUsers.length})
                    </Text>

                    <View style={styles.groupMembersPreviewList}>
                      {selectedUsers.map((user, index) => (
                        <View key={`group-member-${index}`} style={styles.groupMemberPreviewItem}>
                          <Text style={[styles.groupMemberPreviewName, { color: themeColors.text }]}>
                            {user.name}
                          </Text>
                          <Text style={[styles.groupMemberPreviewPhone, { color: themeColors.textSecondary }]}>
                            {user.phoneNumber}
                          </Text>
                          <TouchableOpacity
                            style={styles.groupMemberPreviewRemove}
                            onPress={() => {
                              setSelectedUsers(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <Icon name="close-circle" size={18} color={themeColors.danger} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <Button
                  title={`Create Group${selectedUsers.length > 0 ? ` (${selectedUsers[0].name})` : ''}`}
                  onPress={() => handleAddGroup(selectedUsers)}
                  disabled={isAddingMembers || selectedUsers.length === 0}
                  loading={isAddingMembers}
                  fullWidth
                  size="md"
                  style={styles.createGroupButton}
                />
              </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerActionButton: {
    padding: spacing.xs,
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
  groupInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMembersCount: {
    fontSize: fontSizes.sm,
    marginLeft: 4,
  },
  groupMembersCountText: {
    fontSize: fontSizes.sm,
    marginLeft: 4,
    color: 'rgba(0,0,0,0.5)',
  },
  groupMembersCountNumber: {
    opacity: 0.7,
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
  addMembersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  addGroupButtonText: {
    marginLeft: spacing.xs,
    fontWeight: '500',
    fontSize: fontSizes.sm,
  },
  addGroupContainer: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addGroupTitle: {
    marginLeft: spacing.sm,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  addGroupInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addGroupInput: {
    flex: 2,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    fontSize: fontSizes.md,
  },
  addGroupCountInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    fontSize: fontSizes.md,
    textAlign: 'center',
  },
  addGroupMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    height: 48,
  },
  addGroupMemberButtonText: {
    marginLeft: spacing.xs,
    fontWeight: '500',
    fontSize: fontSizes.sm,
  },
  groupMembersPreview: {
    marginBottom: spacing.md,
  },
  groupMembersPreviewTitle: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
  },
  groupMembersPreviewList: {
    borderRadius: 8,
  },
  groupMemberPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  groupMemberPreviewName: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  groupMemberPreviewPhone: {
    flex: 1,
    fontSize: fontSizes.sm,
  },
  groupMemberPreviewRemove: {
    padding: spacing.xs,
  },
  createGroupButton: {
    marginTop: spacing.md,
  },
});

export default GroupMembersScreen;
