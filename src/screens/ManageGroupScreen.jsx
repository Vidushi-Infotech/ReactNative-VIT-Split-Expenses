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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import firebaseService from '../services/firebaseService';
import { launchImageLibrary } from 'react-native-image-picker';

const ManageGroupScreen = ({ route, navigation }) => {
  const { group } = route.params || {};
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [groupData, setGroupData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    coverImage: group?.coverImageUrl || null,
  });
  
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [currentMembers, setCurrentMembers] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [group, user]);

  const loadGroupData = async () => {
    if (!group?.id || !user?.uid) {
      console.log('🔧 ManageGroup: Missing group or user data');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('🔧 ManageGroup: Loading data for group:', group.id);
      
      // Check if user is admin
      const adminStatus = await firebaseService.isGroupAdmin(group.id, user.uid);
      console.log('🔧 ManageGroup: Admin status:', adminStatus);
      setIsGroupAdmin(adminStatus);
      
      if (!adminStatus) {
        Alert.alert(
          'Access Denied',
          'Only group admins can manage the group.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
        return;
      }
      
      // Load group members
      const membersWithProfiles = await firebaseService.getGroupMembersWithProfiles(group.id);
      console.log('🔧 ManageGroup: Loaded members:', membersWithProfiles);
      setGroupMembers(membersWithProfiles);
      setCurrentMembers(membersWithProfiles);
      
      // Set group data
      setGroupData({
        name: group.name || '',
        description: group.description || '',
        coverImage: group.coverImageUrl || null,
      });
      
    } catch (error) {
      console.error('🔧 ManageGroup: Error loading data:', error);
      Alert.alert('Error', 'Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadGroupData();
    } catch (error) {
      console.error('🔧 ManageGroup: Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };



  const handleInputChange = (field, value) => {
    setGroupData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleUploadCoverImage = () => {
    if (!isGroupAdmin) {
      Alert.alert('Error', 'Only group admins can update the group cover image.');
      return;
    }

    Alert.alert(
      'Update Cover Image',
      'Choose an option',
      [
        { text: 'Gallery', onPress: () => openImagePicker() },
        { text: 'Remove Image', onPress: () => removeCoverImage(), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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
        uploadCoverImage(asset.uri);
      }
    });
  };

  const uploadCoverImage = async (imageUri) => {
    setUploadingImage(true);
    try {
      console.log('🖼️ Uploading cover image for group:', group.id);
      
      // Upload image to Firebase Storage
      const imageUrl = await firebaseService.uploadGroupCoverImage(imageUri, group.id);
      
      // Update group with new cover image URL
      await firebaseService.updateGroup(group.id, {
        coverImageUrl: imageUrl
      });
      
      // Update local state
      setGroupData(prev => ({
        ...prev,
        coverImage: imageUrl
      }));
      
      Alert.alert('Success', 'Cover image updated successfully!');
      
    } catch (error) {
      console.error('🖼️ Error uploading cover image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeCoverImage = async () => {
    Alert.alert(
      'Remove Cover Image',
      'Are you sure you want to remove the current cover image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploadingImage(true);
            try {
              console.log('🗑️ Removing cover image for group:', group.id);
              
              // Update group to remove cover image
              await firebaseService.updateGroup(group.id, {
                coverImageUrl: null
              });
              
              // Update local state
              setGroupData(prev => ({
                ...prev,
                coverImage: null
              }));
              
              Alert.alert('Success', 'Cover image removed successfully!');
              
            } catch (error) {
              console.error('🗑️ Error removing cover image:', error);
              Alert.alert('Error', 'Failed to remove image. Please try again.');
            } finally {
              setUploadingImage(false);
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = async (member) => {
    if (!isGroupAdmin) {
      Alert.alert('Error', 'Only group admins can remove members.');
      return;
    }

    if (member.isYou) {
      Alert.alert('Error', 'You cannot remove yourself from the group.');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Removing member:', member.userId);
              await firebaseService.removeMemberFromGroup(group.id, member.userId);
              
              // Refresh the group data
              await loadGroupData();
              
              Alert.alert('Success', `${member.name} has been removed from the group.`);
            } catch (error) {
              console.error('🗑️ Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!isGroupAdmin) {
      Alert.alert('Error', 'Only group admins can update the group.');
      return;
    }
    
    if (!groupData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    
    setSaving(true);
    try {
      console.log('🔧 ManageGroup: Updating group:', group.id);
      
      const updates = {
        name: groupData.name.trim(),
        description: groupData.description.trim(),
      };
      
      // Add cover image if changed
      if (groupData.coverImage && groupData.coverImage !== group.coverImageUrl) {
        updates.coverImageUrl = groupData.coverImage;
      }
      
      await firebaseService.updateGroup(group.id, updates);
      
      Alert.alert(
        'Success',
        'Group updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      console.error('🔧 ManageGroup: Error updating group:', error);
      Alert.alert('Error', 'Failed to update group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = groupMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Group</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading group data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Group</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Cover Image Upload */}
        <View style={styles.coverImageSection}>
          <TouchableOpacity 
            style={styles.coverImageContainer} 
            onPress={handleUploadCoverImage}
            disabled={uploadingImage || !isGroupAdmin}
          >
            <View style={styles.groupImageWrapper}>
              {uploadingImage ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              ) : groupData.coverImage ? (
                <Image source={{ uri: groupData.coverImage }} style={styles.coverImage} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.groupAvatar}>🎭</Text>
                  <Text style={styles.placeholderText}>Group Photo</Text>
                </View>
              )}
              {isGroupAdmin && !uploadingImage && (
                <View style={styles.editIcon}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          {isGroupAdmin && (
            <Text style={styles.imageHintText}>
              {groupData.coverImage ? 'Tap to update group photo' : 'Tap to add group photo'}
            </Text>
          )}
        </View>

        {/* Group Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            value={groupData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Enter group name"
            placeholderTextColor={theme.colors.textMuted}
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
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Group Members Section */}
        <View style={styles.membersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Group Members ({groupMembers.length})</Text>
            {groupMembers.length > 5 && (
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color={theme.colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search members..."
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
            )}
          </View>
          
          {filteredMembers.length === 0 ? (
            <View style={styles.noMembersContainer}>
              <Ionicons name="people" size={48} color={theme.colors.textMuted} />
              <Text style={styles.noMembersText}>No members found</Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {filteredMembers.map((member, index) => (
                <View key={member.userId} style={[
                  styles.memberItem,
                  index === filteredMembers.length - 1 && styles.lastMemberItem
                ]}>
                  <View style={styles.memberMainInfo}>
                    {member.avatar ? (
                      <Image
                        source={{ uri: member.avatar }}
                        style={styles.memberAvatar}
                      />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberAvatarText}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>
                          {member.name}{member.isYou ? ' (You)' : ''}
                        </Text>
                        {member.role === 'admin' && (
                          <View style={styles.adminBadge}>
                            <Ionicons name="crown" size={12} color="#F59E0B" />
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberRole}>
                        {member.role === 'admin' ? 'Group Administrator' : 'Member'}
                      </Text>
                      <Text style={styles.memberJoinDate}>
                        Joined {member.joinedAt ? new Date(member.joinedAt?.seconds * 1000).toLocaleDateString() : 'recently'}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Remove Member Button - Only show for admins and not for themselves */}
                  {isGroupAdmin && !member.isYou && (
                    <TouchableOpacity
                      style={styles.removeMemberButton}
                      onPress={() => handleRemoveMember(member)}
                    >
                      <Ionicons name="person-remove" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
  coverImageSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  coverImageContainer: {
    position: 'relative',
  },
  groupImageWrapper: {
    position: 'relative',
  },
  groupAvatar: {
    fontSize: 60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.borderLight,
    textAlign: 'center',
    lineHeight: 120,
  },
  coverImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  uploadingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  placeholderContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  imageHintText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconText: {
    fontSize: 16,
    color: '#FFFFFF',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.borderLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 16,
    maxWidth: 200,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  contactName: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
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
    backgroundColor: theme.colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
    marginRight: 8,
  },
  memberRole: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  memberJoinDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  removeMemberButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    marginLeft: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  membersList: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  lastMemberItem: {
    borderBottomWidth: 0,
  },
  memberMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noMembersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMembersText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default ManageGroupScreen;
