import React, { useState } from 'react';
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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const CreateNewGroupScreen = ({ onClose, onSave }) => {
  const { theme } = useTheme();
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    coverImage: null,
  });
  
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample suggested contacts
  const suggestedContacts = [
    {
      recordID: '1',
      displayName: 'Shantanu Roy',
      thumbnailPath: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
    },
    {
      recordID: '2', 
      displayName: 'Kavita Sharma',
      thumbnailPath: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
    },
    {
      recordID: '3',
      displayName: 'Rohit Mehta',
      thumbnailPath: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
    },
  ];

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
    Alert.alert(
      'Upload Cover Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Camera selected') },
        { text: 'Gallery', onPress: () => console.log('Gallery selected') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = () => {
    if (!groupData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    const newGroup = {
      id: Date.now().toString(),
      name: groupData.name,
      description: groupData.description,
      members: selectedMembers,
      coverImage: groupData.coverImage,
      createdAt: new Date().toISOString(),
      totalExpenses: 0,
      yourShare: 0,
    };

    console.log('Creating new group:', newGroup);
    
    if (onSave) {
      onSave(newGroup);
    }
    
    if (onClose) {
      onClose();
    }
  };

  const filteredContacts = suggestedContacts.filter(contact =>
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
            <View style={styles.uploadIcon}>
              <Text style={styles.uploadIconText}>↑</Text>
            </View>
            <Text style={styles.uploadText}>Upload cover image</Text>
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
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Person or Phone Number"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.searchIcon}>
              <Text style={styles.searchIconText}>🔍</Text>
            </TouchableOpacity>
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

          {/* Suggested Contacts */}
          <Text style={styles.suggestedTitle}>Suggested Contacts</Text>
          {filteredContacts.map((contact) => (
            <TouchableOpacity
              key={contact.recordID}
              style={styles.contactItem}
              onPress={() => handleSelectMember(contact)}
            >
              <Image
                source={{
                  uri: contact.thumbnailPath || 'https://via.placeholder.com/50x50/333/fff?text=' + contact.displayName.charAt(0)
                }}
                style={styles.contactImage}
              />
              <Text style={styles.contactName}>{contact.displayName}</Text>
              {selectedMembers.find(member => member.recordID === contact.recordID) && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
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
  },
  searchIcon: {
    padding: 4,
  },
  searchIconText: {
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contactName: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
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
});

export default CreateNewGroupScreen;
