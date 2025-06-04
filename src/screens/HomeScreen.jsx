import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import CreateNewGroupScreen from './CreateNewGroupScreen';

const HomeScreen = ({ navigation }) => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groups, setGroups] = useState([
    {
      id: 1,
      name: 'Good Times Gang',
      avatar: '🎭',
      youOwe: 200,
      details: [
        { text: 'You owe Raj P.', amount: 240, type: 'owe' },
        { text: 'Samir J. owes you', amount: 40, type: 'owed' },
      ]
    },
    {
      id: 2,
      name: 'Plan Pending',
      avatar: '🕶️',
      youAreOwed: 320,
      details: [
        { text: 'Kishor C. owes you', amount: 160, type: 'owed' },
        { text: 'Sanjiv J. owes you', amount: 160, type: 'owed' },
      ]
    },
    {
      id: 3,
      name: 'Jungle Crew',
      avatar: '🌲',
      youOwe: 200,
      details: [
        { text: 'You owe Suhani T.', amount: 200, type: 'owe' },
      ]
    },
    {
      id: 4,
      name: 'Road Tripper',
      avatar: '👷',
      youAreOwed: 660,
      details: [
        { text: 'Namrata S. owes you', amount: 110, type: 'owed' },
        { text: 'Suraj R. owes you', amount: 110, type: 'owed' },
      ],
      moreBalances: 4
    },
  ]);

  const handleAddGroup = () => {
    setShowCreateGroup(true);
  };

  const handleCloseCreateGroup = () => {
    setShowCreateGroup(false);
  };

  const handleSaveNewGroup = (newGroup) => {
    setGroups(prevGroups => [...prevGroups, newGroup]);
    setShowCreateGroup(false);
  };

  const handleSearch = () => {
    // Handle search functionality
    console.log('Search pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleSearch}>
            <Text style={styles.headerIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddGroup}>
            <Text style={styles.headerIcon}>👥+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Overall Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.sectionTitle}>Overall Balance</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Net Balance</Text>
              <Text style={styles.balanceAmountGreen}>₹580</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>You Get</Text>
              <Text style={styles.balanceAmountGreen}>₹980</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>You Owe</Text>
              <Text style={styles.balanceAmountOrange}>₹400</Text>
            </View>
          </View>
        </View>

        {/* Groups Wise Expenses */}
        <View style={styles.groupsSection}>
          <Text style={styles.sectionTitle}>Groups Wise Expenses</Text>

          {groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetail', { group })}
            >
              <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatar}>{group.avatar}</Text>
                  </View>
                  <Text style={styles.groupName}>{group.name}</Text>
                </View>
                <View style={styles.groupBalance}>
                  {group.youOwe && (
                    <>
                      <Text style={styles.balanceTypeOwe}>You owe</Text>
                      <Text style={styles.balanceAmountOrange}>₹{group.youOwe}</Text>
                    </>
                  )}
                  {group.youAreOwed && (
                    <>
                      <Text style={styles.balanceTypeOwed}>You are owed</Text>
                      <Text style={styles.balanceAmountGreen}>₹{group.youAreOwed}</Text>
                    </>
                  )}
                </View>
              </View>

              {/* Group Details */}
              <View style={styles.groupDetails}>
                {group.details.map((detail, index) => (
                  <View key={index} style={styles.detailRow}>
                    <View style={styles.detailLine} />
                    <Text style={styles.detailText}>{detail.text}</Text>
                    <Text style={detail.type === 'owe' ? styles.detailAmountOrange : styles.detailAmountGreen}>
                      ₹{detail.amount}
                    </Text>
                  </View>
                ))}

                {group.moreBalances && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLine} />
                    <Text style={styles.moreBalancesText}>📊 {group.moreBalances} more balances</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddGroup}>
        <View style={styles.addButtonContainer}>
          <Image
            source={require('../Assets/AddLogo.png')}
            style={styles.addButtonImage}
            resizeMode="contain"
            onError={(error) => console.log('Image load error:', error)}
          />
        </View>
      </TouchableOpacity>

      {/* Create New Group Modal */}
      <Modal
        visible={showCreateGroup}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CreateNewGroupScreen
          onClose={handleCloseCreateGroup}
          onSave={handleSaveNewGroup}
        />
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 12,
  },
  headerIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  balanceSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  balanceAmountGreen: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  balanceAmountOrange: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  groupsSection: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for floating button
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    fontSize: 24,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  balanceTypeOwe: {
    fontSize: 12,
    color: '#F59E0B',
    marginBottom: 2,
  },
  balanceTypeOwed: {
    fontSize: 12,
    color: '#10B981',
    marginBottom: 2,
  },
  groupDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
    marginLeft: 24,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
  },
  detailAmountOrange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  detailAmountGreen: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  moreBalancesText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonImage: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
});

export default HomeScreen;