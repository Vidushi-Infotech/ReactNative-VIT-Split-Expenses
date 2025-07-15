import React, {useState, useEffect} from 'react';
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import Dropdown from '../components/Dropdown';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import firebaseService from '../services/firebaseService';
import {launchImageLibrary} from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AddExpenseScreen = ({route, navigation}) => {
  const {group} = route.params || {};
  const {theme} = useTheme();
  const {user} = useAuth();

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState({
    code: 'INR',
    symbol: '₹',
  });
  const [paidBy, setPaidBy] = useState(null);
  const [splitType, setSplitType] = useState('Equal');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [receiptImage, setReceiptImage] = useState(null);

  // Categories data
  const categories = [
    {id: 1, name: 'Food', emoji: '🍽️', color: '#FEF3C7'},
    {id: 2, name: 'Transportation', emoji: '🚗', color: '#FECACA'},
    {id: 3, name: 'Shopping', emoji: '🛍️', color: '#E0E7FF'},
    {id: 4, name: 'Drinks', emoji: '🍺', color: '#FED7AA'},
    {id: 5, name: 'Entertainment', emoji: '🎬', color: '#F3E8FF'},
    {id: 6, name: 'Health', emoji: '🏥', color: '#FECACA'},
    {id: 7, name: 'Other', emoji: '📝', color: '#F3F4F6'},
  ];

  // Currency options
  const currencies = [
    {code: 'INR', symbol: '₹', name: 'Indian Rupee'},
    {code: 'USD', symbol: '$', name: 'US Dollar'},
    {code: 'EUR', symbol: '€', name: 'Euro'},
  ];

  const [groupMembers, setGroupMembers] = useState([]);

  useEffect(() => {
    loadGroupMembers();
  }, [group]);

  useEffect(() => {
    if (groupMembers.length > 0) {
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
    }
  }, [groupMembers]);

  const loadGroupMembers = async () => {
    if (!group?.id) {
      console.log('No group ID provided for AddExpenseScreen');
      return;
    }

    console.log('AddExpenseScreen: Loading members for group:', group.id);
    setMembersLoading(true);
    try {
      const membersWithProfiles =
        await firebaseService.getGroupMembersWithProfiles(group.id);
      console.log(
        'AddExpenseScreen: Loaded group members:',
        membersWithProfiles,
      );
      setGroupMembers(membersWithProfiles);
    } catch (error) {
      console.error('AddExpenseScreen: Error loading group members:', error);
      Alert.alert('Error', 'Failed to load group members');
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    calculateSplit();
  }, [amount, splitType]);

  // Separate effect for member selection changes
  useEffect(() => {
    if (members.length > 0) {
      calculateSplit();
    }
  }, [members.map(m => m.isSelected).join(',')]);

  const calculateSplit = () => {
    const totalAmount = parseFloat(amount) || 0;
    const selectedMembers = members.filter(m => m.isSelected);

    if (selectedMembers.length === 0) return;

    let updatedMembers = [...members];

    switch (splitType) {
      case 'Equal':
        const equalAmount = totalAmount / selectedMembers.length;
        updatedMembers = updatedMembers.map(member => ({
          ...member,
          amount: member.isSelected ? equalAmount : 0,
        }));
        break;

      case 'Unequal':
        // For unequal split, initialize with equal amounts if amounts are not set
        updatedMembers = updatedMembers.map(member => {
          if (member.isSelected) {
            // If member amount is not set or is 0, set equal distribution
            if (!member.amount || member.amount === 0) {
              return {
                ...member,
                amount: totalAmount / selectedMembers.length,
              };
            }
            return member;
          }
          return {
            ...member,
            amount: 0,
          };
        });
        break;

      case 'By Percentage':
        updatedMembers = updatedMembers.map(member => {
          if (member.isSelected) {
            // Initialize with equal percentage if not set
            if (!member.percentage || member.percentage === 0) {
              const equalPercentage = 100 / selectedMembers.length;
              return {
                ...member,
                percentage: equalPercentage,
                amount: (totalAmount * equalPercentage) / 100,
              };
            }
            return {
              ...member,
              amount: (totalAmount * member.percentage) / 100,
            };
          }
          return {
            ...member,
            amount: 0,
            percentage: 0,
          };
        });
        break;

      case 'By Share':
        updatedMembers = updatedMembers.map(member => {
          if (member.isSelected) {
            // Initialize with 1 share if not set
            if (!member.shares || member.shares === 0) {
              const totalShares = selectedMembers.length; // Each gets 1 share initially
              return {
                ...member,
                shares: 1,
                amount: totalAmount / totalShares,
              };
            }
            // Recalculate based on existing shares
            const totalShares = selectedMembers.reduce(
              (sum, m) => sum + (m.shares || 1),
              0,
            );
            return {
              ...member,
              amount: (totalAmount * member.shares) / totalShares,
            };
          }
          return {
            ...member,
            amount: 0,
            shares: 0,
          };
        });
        break;
    }

    setMembers(updatedMembers);
  };

  const handleMemberToggle = memberId => {
    const updatedMembers = members.map(member =>
      member.id === memberId
        ? {...member, isSelected: !member.isSelected}
        : member,
    );
    setMembers(updatedMembers);
  };

  const handleMemberValueChange = (memberId, field, value) => {
    const numericValue = parseFloat(value) || 0;
    const totalAmount = parseFloat(amount) || 0;
    
    const updatedMembers = members.map(member => {
      if (member.id === memberId) {
        const updatedMember = {...member, [field]: numericValue};
        
        // For percentage and share modes, recalculate amount automatically
        if (field === 'percentage' && totalAmount > 0) {
          updatedMember.amount = (totalAmount * numericValue) / 100;
        } else if (field === 'shares' && totalAmount > 0) {
          // Calculate total shares to get the ratio
          const selectedMembers = members.filter(m => m.isSelected);
          const otherTotalShares = selectedMembers.reduce((sum, m) => {
            return sum + (m.id === memberId ? numericValue : (m.shares || 1));
          }, 0);
          updatedMember.amount = (totalAmount * numericValue) / otherTotalShares;
        }
        
        return updatedMember;
      }
      return member;
    });
    
    // For share mode, recalculate all amounts when one share changes
    if (field === 'shares' && totalAmount > 0) {
      const selectedMembers = updatedMembers.filter(m => m.isSelected);
      const totalShares = selectedMembers.reduce((sum, m) => sum + (m.shares || 1), 0);
      
      const finalMembers = updatedMembers.map(member => {
        if (member.isSelected) {
          return {
            ...member,
            amount: (totalAmount * (member.shares || 1)) / totalShares,
          };
        }
        return member;
      });
      
      setMembers(finalMembers);
    } else {
      setMembers(updatedMembers);
    }
  };

  const handleUploadReceipt = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setReceiptImage(asset.uri);
      }
    });
  };

  const handleSave = async () => {
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

    const selectedMembers = members.filter(m => m.isSelected);
    if (selectedMembers.length === 0) {
      Alert.alert(
        'Error',
        'Please select at least one member to split the expense',
      );
      return;
    }

    // Validate split calculations
    const totalSplit = selectedMembers.reduce(
      (sum, member) => sum + (member.amount || 0),
      0,
    );
    const expenseAmount = parseFloat(amount);

    if (Math.abs(totalSplit - expenseAmount) > 0.01) {
      Alert.alert(
        'Error',
        `Split amounts (₹${totalSplit.toFixed(
          2,
        )}) don't match expense amount (₹${expenseAmount.toFixed(2)})`,
      );
      return;
    }

    setLoading(true);
    try {
      // Prepare participants data
      const participants = selectedMembers.map(member => ({
        userId: member.userId || member.id,
        name: member.name,
        amount: member.amount || 0,
        percentage: member.percentage || 0,
        shares: member.shares || 1,
      }));

      // Prepare expense data
      const expenseData = {
        description: description.trim(),
        amount: expenseAmount,
        currency: selectedCurrency.code,
        category: selectedCategory,
        paidBy: paidBy,
        splitType,
        participants,
        receiptUrl: receiptImage, // Store local image URI
      };

      // Create expense in Firebase
      await firebaseService.createExpense(group.id, expenseData);

      Alert.alert('Success', 'Expense added successfully!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSplitTypeButtons = () => (
    <View style={styles.splitTypeContainer}>
      <Text style={styles.sectionLabel}>Split with</Text>
      <View style={styles.splitButtons}>
        {['Equal', 'Unequal', 'By Percentage', 'By Share'].map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.splitButton,
              splitType === type && styles.activeSplitButton,
            ]}
            onPress={() => setSplitType(type)}>
            <Text
              style={[
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

  const renderMemberItem = member => {
    const displayAmount = member.amount || 0;

    return (
      <View key={member.id} style={styles.memberItem}>
        <TouchableOpacity
          style={styles.memberCheckbox}
          onPress={() => handleMemberToggle(member.id)}>
          <View
            style={[styles.checkbox, member.isSelected && styles.checkedBox]}>
            {member.isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        {member.avatar ? (
          <Image source={{uri: member.avatar}} style={styles.memberAvatar} />
        ) : (
          <View style={styles.memberAvatarPlaceholder}>
            <Text style={styles.memberAvatarText}>
              {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}

        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {member.name}
            {member.isYou ? ' (You)' : ''}
          </Text>
          <Text style={styles.memberAmount}>
            {selectedCurrency.symbol}
            {displayAmount.toFixed(0)}
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
              onChangeText={value => {
                const field =
                  splitType === 'By Percentage'
                    ? 'percentage'
                    : splitType === 'By Share'
                    ? 'shares'
                    : 'amount';
                handleMemberValueChange(member.id, field, value);
              }}
              keyboardType="numeric"
              placeholder={
                splitType === 'By Percentage'
                  ? '0%'
                  : splitType === 'By Share'
                  ? '1'
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
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
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
              renderItem={({item, onSelect}) => (
                <TouchableOpacity
                  style={styles.categoryOption}
                  onPress={() => onSelect(item)}>
                  <View
                    style={[
                      styles.categoryIcon,
                      {backgroundColor: item.color},
                    ]}>
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
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.memberOption}
                onPress={() => setPaidBy(item)}>
                <Image
                  source={{uri: item.avatar}}
                  style={styles.optionAvatar}
                />
                <Text style={styles.optionText}>
                  {item.name}
                  {item.isYou ? ' (You)' : ''}
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
          {membersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading group members...</Text>
            </View>
          ) : members.length > 0 ? (
            members.map(renderMemberItem)
          ) : (
            <View style={styles.noMembersContainer}>
              <Text style={styles.noMembersText}>No group members found</Text>
            </View>
          )}
        </View>

        {/* Total Amount */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            {selectedCurrency.symbol}
            {amount || '0'}
          </Text>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadReceipt}>
            <Text style={styles.uploadIcon}>📎</Text>
            <Text style={styles.uploadText}>
              {receiptImage ? 'Receipt Added' : 'Upload Receipt'}
            </Text>
          </TouchableOpacity>
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
      paddingHorizontal: 16,
    },
    inputContainer: {
      marginVertical: 12,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    descriptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    descriptionInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
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
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
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
      color: theme.colors.text,
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
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    activeSplitButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    splitButtonText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
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
    buttonContainer: {
      paddingHorizontal: 0,
      paddingVertical: 16,
      paddingBottom: 32,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
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
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
    },
    uploadIcon: {
      fontSize: 16,
      marginRight: 8,
    },
    uploadText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
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
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    noMembersContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    noMembersText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
  });

export default AddExpenseScreen;
