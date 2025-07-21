import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import firebaseService from '../services/firebaseService';

const GroupDetailsScreen = ({route, navigation}) => {
  const {group} = route.params || {};
  const {theme} = useTheme();
  const {user} = useAuth();
  const [groupMembers, setGroupMembers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [group]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      // Load group members
      const members = await firebaseService.getGroupMembersWithProfiles(group.id);
      setGroupMembers(members);

      // Check admin status
      const adminStatus = await firebaseService.isGroupAdmin(group.id, user?.uid);
      setIsGroupAdmin(adminStatus);

      // Debug group object
      console.log('Group object:', group);
      console.log('Group adminIds:', group.adminIds);
      console.log('Group createdBy:', group.createdBy);
      console.log('Members:', members.map(m => ({userId: m.userId, name: m.name})));

      // Determine admin users using multiple methods
      let admins = [];
      
      // Method 1: If group has proper admin fields
      if (group.adminIds && group.adminIds.length > 0) {
        admins = members.filter(member => 
          group.adminIds.includes(member.userId) || member.userId === group.createdBy
        );
        console.log('Found admins from group adminIds:', admins);
      }
      
      // Method 2: For older groups without adminIds - check if current user is admin
      if (admins.length === 0 && adminStatus && user?.uid) {
        const currentUserMember = members.find(m => m.userId === user.uid);
        if (currentUserMember) {
          admins.push(currentUserMember);
          console.log('Current user is admin (fallback):', currentUserMember.name);
        }
      }
      
      // Method 3: Check member roles or flags
      if (admins.length === 0) {
        const membersWithAdminFlags = members.filter(member => {
          return member.isAdmin || member.isCreator || member.role === 'admin';
        });
        
        if (membersWithAdminFlags.length > 0) {
          console.log('Found members with admin flags:', membersWithAdminFlags);
          admins = membersWithAdminFlags;
        }
      }
      
      // Method 4: Ultimate fallback - first member is likely creator
      if (admins.length === 0 && members.length > 0) {
        console.log('Ultimate fallback: making first member admin');
        admins = [members[0]];
      }
      
      // Remove duplicates
      const uniqueAdmins = admins.filter((admin, index, self) => 
        index === self.findIndex(a => a.userId === admin.userId)
      );
      
      console.log('Final admin users:', uniqueAdmins);
      setAdminUsers(uniqueAdmins);
    } catch (error) {
      console.error('Error loading group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderMemberItem = (member, isAdmin = false) => (
    <View key={member.userId} style={styles.memberItem}>
      {member.avatar ? (
        <Image source={{uri: member.avatar}} style={styles.memberAvatar} />
      ) : (
        <View style={styles.memberAvatarPlaceholder}>
          <Text style={styles.memberAvatarText}>
            {member.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {member.name}
          {member.userId === user?.uid ? ' (You)' : ''}
        </Text>
        <Text style={styles.memberEmail}>{member.email || 'No email'}</Text>
      </View>
      {isAdmin && (
        <View style={styles.adminBadge}>
          <MaterialIcons name="admin-panel-settings" size={16} color="#4F46E5" />
          <Text style={styles.adminText}>Admin</Text>
        </View>
      )}
    </View>
  );

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Group Info Section */}
        <View style={styles.section}>
          <View style={styles.groupHeader}>
            {group.coverImageUrl ? (
              <Image
                source={{uri: group.coverImageUrl}}
                style={styles.groupImage}
              />
            ) : (
              <View style={styles.groupImagePlaceholder}>
                <Text style={styles.groupImageText}>{group.avatar || '🎭'}</Text>
              </View>
            )}
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDescription}>
                {group.description || 'No description'}
              </Text>
            </View>
          </View>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="group" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Total Members</Text>
            <Text style={styles.infoValue}>{groupMembers.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="admin-panel-settings" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Total Admins</Text>
            <Text style={styles.infoValue}>{adminUsers.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="date-range" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Created On</Text>
            <Text style={styles.infoValue}>{formatDate(group.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="currency-rupee" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Total Expenses</Text>
            <Text style={styles.infoValue}>₹{group.totalExpenses?.toFixed(0) || '0'}</Text>
          </View>
        </View>

        {/* Admins Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Admins</Text>
          {adminUsers.length > 0 ? (
            adminUsers.map(member => renderMemberItem(member, true))
          ) : (
            <Text style={styles.noDataText}>No admins found</Text>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Members</Text>
          {groupMembers.length > 0 ? (
            groupMembers.map(member => renderMemberItem(member, false))
          ) : (
            <Text style={styles.noDataText}>No members found</Text>
          )}
        </View>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
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
    headerRight: {
      width: 24,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    section: {
      backgroundColor: theme.colors.surface,
      marginVertical: 8,
      marginHorizontal: 16,
      borderRadius: 12,
      padding: 16,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    groupImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 16,
    },
    groupImagePlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    groupImageText: {
      fontSize: 30,
    },
    groupInfo: {
      flex: 1,
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
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 12,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    memberAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    memberAvatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    memberEmail: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    adminBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EEF2FF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    adminText: {
      fontSize: 12,
      color: '#4F46E5',
      fontWeight: '500',
      marginLeft: 4,
    },
    noDataText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 16,
    },
  });

export default GroupDetailsScreen;