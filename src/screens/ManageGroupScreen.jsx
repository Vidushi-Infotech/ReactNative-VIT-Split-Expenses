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

const ManageGroupScreen = ({ route, navigation }) => {
  const { group } = route.params || {};
  const [groupData, setGroupData] = useState({
    name: group?.name || 'Trip to Busan 🚗',
    description: 'Keep rent, utilities, and groceries fair.',
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

  // Current group members (already selected)
  const currentMembers = [
    {
      recordID: '4',
      displayName: 'You',
      thumbnailPath: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
    },
    {
      recordID: '5',
      displayName: 'Samir Jakaria',
      thumbnailPath: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
    },
    {
      recordID: '6',
      displayName: 'Raj Pathan',
      thumbnailPath: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
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

    console.log('Updating group:', groupData);
    navigation.goBack();
  };

  const filteredContacts = suggestedContacts.filter(contact =>
    contact.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Group</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cover Image Upload */}
        <View style={styles.coverImageSection}>
          <TouchableOpacity style={styles.coverImageContainer} onPress={handleUploadCoverImage}>
            <View style={styles.groupImageWrapper}>
              <Text style={styles.groupAvatar}>🎭</Text>
              <View style={styles.editIcon}>
                <Text style={styles.editIconText}>📝</Text>
              </View>
            </View>
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

          {/* Current Members */}
          <View style={styles.currentMembersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {currentMembers.map((member) => (
                <TouchableOpacity
                  key={member.recordID}
                  style={styles.currentMember}
                >
                  <Image
                    source={{
                      uri: member.thumbnailPath || 'https://via.placeholder.com/50x50/333/fff?text=' + member.displayName.charAt(0)
                    }}
                    style={styles.currentMemberImage}
                  />
                  {member.displayName !== 'You' && (
                    <View style={styles.removeIcon}>
                      <Text style={styles.removeIconText}>×</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#2D3748',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
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
    backgroundColor: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 120,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
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
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: '#FFFFFF',
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
    color: '#2D3748',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
  },
  searchIcon: {
    padding: 4,
  },
  searchIconText: {
    fontSize: 16,
  },
  currentMembersContainer: {
    marginBottom: 16,
  },
  currentMember: {
    position: 'relative',
    marginRight: 12,
  },
  currentMemberImage: {
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
    color: '#6B7280',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    color: '#2D3748',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
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

export default ManageGroupScreen;
