import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import Dropdown from '../components/Dropdown';

const AddExpenseScreen = ({ route, navigation }) => {
  const { group } = route.params || {};

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState({ code: 'INR', symbol: '₹' });
  const [paidBy, setPaidBy] = useState(null);
  const [splitType, setSplitType] = useState('Equal');
  const [members, setMembers] = useState([]);

  // Categories data
  const categories = [
    { id: 1, name: 'Food', emoji: '🍽️', color: '#FEF3C7' },
    { id: 2, name: 'Transportation', emoji: '🚗', color: '#FECACA' },
    { id: 3, name: 'Shopping', emoji: '🛍️', color: '#E0E7FF' },
    { id: 4, name: 'Drinks', emoji: '🍺', color: '#FED7AA' },
    { id: 5, name: 'Entertainment', emoji: '🎬', color: '#F3E8FF' },
    { id: 6, name: 'Health', emoji: '🏥', color: '#FECACA' },
  ];

  // Currency options
  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
  ];

  // Mock group members
  const groupMembers = [
    {
      id: 1,
      name: 'Raj Pathan',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
    },
    {
      id: 2,
      name: 'Ajit Kumar',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
    },
    {
      id: 3,
      name: 'Samir Jakaria',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face',
    },
    {
      id: 4,
      name: 'Vishal Sai',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face',
      isYou: true,
    },
  ];

  useEffect(() => {
    // Initialize members with equal split
    const initialMembers = groupMembers.map(member => ({
      ...member,
      isSelected: true,
      amount: 0,
      percentage: 0,
      shares: 1,
    }));
    setMembers(initialMembers);

    // Set default paid by to "You"
    const youMember = initialMembers.find(m => m.isYou);
    if (youMember) {
      setPaidBy(youMember);
    }
  }, []);

  useEffect(() => {
    calculateSplit();
  }, [amount, splitType, members]);

  const calculateSplit = () => {
    const totalAmount = parseFloat(amount) || 0;
    const selectedMembers = members.filter(m => m.isSelected);

    if (totalAmount === 0 || selectedMembers.length === 0) return;

    let updatedMembers = [...members];

    switch (splitType) {
      case 'Equal':
        const equalAmount = totalAmount / selectedMembers.length;
        updatedMembers = updatedMembers.map(member => ({
          ...member,
          amount: member.isSelected ? equalAmount : 0,
        }));
        break;

      case 'By Percentage':
        updatedMembers = updatedMembers.map(member => ({
          ...member,
          amount: member.isSelected ? (totalAmount * member.percentage) / 100 : 0,
        }));
        break;

      case 'By Share':
        const totalShares = selectedMembers.reduce((sum, m) => sum + (m.shares || 1), 0);
        updatedMembers = updatedMembers.map(member => ({
          ...member,
          amount: member.isSelected ? (totalAmount * (member.shares || 1)) / totalShares : 0,
        }));
        break;
    }

    setMembers(updatedMembers);
  };

  const handleMemberToggle = (memberId) => {
    const updatedMembers = members.map(member =>
      member.id === memberId
        ? { ...member, isSelected: !member.isSelected }
        : member
    );
    setMembers(updatedMembers);
  };

  const handleMemberValueChange = (memberId, field, value) => {
    const updatedMembers = members.map(member =>
      member.id === memberId
        ? { ...member, [field]: parseFloat(value) || 0 }
        : member
    );
    setMembers(updatedMembers);
  };

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!paidBy) {
      Alert.alert('Error', 'Please select who paid');
      return;
    }

    // Here you would save the expense
    Alert.alert('Success', 'Expense added successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const renderSplitTypeButtons = () => (
    <View style={styles.splitTypeContainer}>
      <Text style={styles.sectionLabel}>Split with</Text>
      <View style={styles.splitButtons}>
        {['Equal', 'Unequal', 'By Percentage', 'By Share'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.splitButton,
              splitType === type && styles.activeSplitButton,
            ]}
            onPress={() => setSplitType(type)}
          >
            <Text style={[
              styles.splitButtonText,
              splitType === type && styles.activeSplitButtonText,
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMemberItem = (member) => {
    const displayAmount = member.amount || 0;

    return (
      <View key={member.id} style={styles.memberItem}>
        <TouchableOpacity
          style={styles.memberCheckbox}
          onPress={() => handleMemberToggle(member.id)}
        >
          <View style={[
            styles.checkbox,
            member.isSelected && styles.checkedBox,
          ]}>
            {member.isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />

        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {member.name}{member.isYou ? ' (You)' : ''}
          </Text>
          <Text style={styles.memberAmount}>
            {selectedCurrency.symbol}{displayAmount.toFixed(0)}
          </Text>
        </View>

        {member.isSelected && splitType !== 'Equal' && (
          <View style={styles.memberInput}>
            <TextInput
              style={styles.inputField}
              value={
                splitType === 'By Percentage'
                  ? member.percentage?.toString() || '0'
                  : splitType === 'By Share'
                  ? member.shares?.toString() || '1'
                  : member.amount?.toString() || '0'
              }
              onChangeText={(value) => {
                const field = splitType === 'By Percentage' ? 'percentage'
                           : splitType === 'By Share' ? 'shares'
                           : 'amount';
                handleMemberValueChange(member.id, field, value);
              }}
              keyboardType="numeric"
              placeholder={
                splitType === 'By Percentage' ? '0%'
                : splitType === 'By Share' ? '1'
                : selectedCurrency.symbol + '0'
              }
            />
            {splitType === 'By Percentage' && (
              <Text style={styles.inputSuffix}>%</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Description Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Add Description</Text>
          <View style={styles.descriptionRow}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Enter Description"
              value={description}
              onChangeText={setDescription}
            />
            <Dropdown
              value={selectedCategory}
              onSelect={setSelectedCategory}
              options={categories}
              placeholder="Category"
              style={styles.categoryDropdown}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryOption}
                  onPress={() => setSelectedCategory(item)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                    <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                  </View>
                  <Text style={styles.categoryText}>{item.name}</Text>
                  {selectedCategory?.id === item.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount</Text>
          <View style={styles.amountRow}>
            <Dropdown
              value={selectedCurrency}
              onSelect={setSelectedCurrency}
              options={currencies}
              style={styles.currencyDropdown}
              displayKey="code"
            />
            <TextInput
              style={styles.amountInput}
              placeholder="160"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Paid By */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Paid by</Text>
          <Dropdown
            value={paidBy}
            onSelect={setPaidBy}
            options={groupMembers}
            placeholder="Select who paid"
            displayKey="name"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberOption}
                onPress={() => setPaidBy(item)}
              >
                <Image source={{ uri: item.avatar }} style={styles.optionAvatar} />
                <Text style={styles.optionText}>
                  {item.name}{item.isYou ? ' (You)' : ''}
                </Text>
                {paidBy?.id === item.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Split Type */}
        {renderSplitTypeButtons()}

        {/* Members List */}
        <View style={styles.membersContainer}>
          {members.map(renderMemberItem)}
        </View>

        {/* Total Amount */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            {selectedCurrency.symbol}{amount || '0'}
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadIcon}>📎</Text>
          <Text style={styles.uploadText}>Upload Receipt</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 24,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  headerRight: {
    width: 24,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginVertical: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  descriptionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  categoryDropdown: {
    width: 120,
    marginBottom: 0,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyDropdown: {
    width: 80,
    marginRight: 12,
    marginBottom: 0,
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  splitTypeContainer: {
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  splitButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  splitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  activeSplitButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  splitButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeSplitButtonText: {
    color: '#FFFFFF',
  },
  membersContainer: {
    marginVertical: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkedBox: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  memberAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  inputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  inputSuffix: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  uploadIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default AddExpenseScreen;