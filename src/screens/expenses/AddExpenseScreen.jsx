import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import GroupService from '../../services/GroupService';
import ExpenseService from '../../services/ExpenseService';
import UserService from '../../services/UserService';
import NotificationService from '../../services/NotificationService';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp, FadeIn, SlideInRight } from 'react-native-reanimated';
import { colors, spacing, fontSizes, borderRadius } from '../../theme/theme';
import ImagePicker from 'react-native-image-crop-picker';
import DatePicker from 'react-native-date-picker';

const AddExpenseScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { userProfile } = useAuth();

  const { groupId } = route.params;
  const [group, setGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [fetchingGroup, setFetchingGroup] = useState(true);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [image, setImage] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [paidBy, setPaidBy] = useState(''); // No default value - must be selected manually
  const [splitType, setSplitType] = useState('equal'); // 'equal', 'unequal', 'group'
  const [customSplits, setCustomSplits] = useState({});
  const [customAmounts, setCustomAmounts] = useState({});
  const [paidByModalVisible, setPaidByModalVisible] = useState(false);
  const [splitTypeModalVisible, setSplitTypeModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // UI state
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);

  // Define expense categories
  const expenseCategories = [
    'Food', 'Transport', 'Shopping', 'Entertainment', 'Groceries',
    'Bills', 'Travel', 'Health', 'Education', 'Other'
  ];

  // Fetch group data when component mounts
  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  // Set current user as a participant by default when userProfile is available
  useEffect(() => {
    if (userProfile && userProfile.id && !participants.includes(userProfile.id)) {
      setParticipants([userProfile.id]);
    }
  }, [userProfile]);

  // Initialize custom splits when participants change
  useEffect(() => {
    if (participants.length > 0) {
      const equalShare = 100 / participants.length;
      const newCustomSplits = {};

      participants.forEach(participantId => {
        newCustomSplits[participantId] = equalShare;
      });

      setCustomSplits(newCustomSplits);
    }
  }, [participants]);

  // Function to fetch group data
  const fetchGroupData = async () => {
    if (!groupId) {
      setFetchingGroup(false);
      return;
    }

    try {
      setFetchingGroup(true);

      // Fetch group details
      const groupData = await GroupService.getGroupById(groupId);
      setGroup(groupData);

      if (groupData) {
        try {
          // Fetch user details for all members
          const memberPromises = groupData.members.map(async memberId => {
            try {
              return await UserService.getUserById(memberId);
            } catch (error) {
              console.error(`Error fetching user ${memberId}:`, error);
              return null;
            }
          });

          const memberDetails = await Promise.all(memberPromises);
          setGroupMembers(memberDetails.filter(Boolean)); // Filter out any null values
        } catch (error) {
          console.error('Error fetching group members:', error);
          // Fallback to just using the group members array
          setGroupMembers(groupData.members.map(memberId => ({
            id: memberId,
            name: 'User ' + memberId.substring(0, 5),
            phoneNumber: 'Unknown',
            avatar: null
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      Alert.alert('Error', 'Failed to load group data. Please try again.');
    } finally {
      setFetchingGroup(false);
    }
  };

  // Define theme colors based on mode
  const themeColors = {
    background: isDarkMode ? colors.dark.default : colors.light.default,
    card: isDarkMode ? 'rgba(45, 45, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    text: isDarkMode ? colors.white : colors.dark.default,
    textSecondary: isDarkMode ? colors.gray[300] : colors.gray[700],
    placeholder: isDarkMode ? colors.gray[500] : colors.gray[400],
    border: isDarkMode ? colors.gray[700] : colors.gray[200],
    inputBg: isDarkMode ? 'rgba(30, 30, 40, 0.8)' : 'rgba(250, 250, 255, 0.9)',
  };

  if (fetchingGroup) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.primary.default} />
        <Text style={[styles.text, { color: themeColors.text, marginTop: 16 }]}>Loading group details...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <Icon name="alert-circle-outline" size={60} color={colors.error} />
        <Text style={[styles.text, { color: themeColors.text, marginTop: 16 }]}>Group not found</Text>
        <TouchableOpacity
          style={[styles.backButtonLarge, { backgroundColor: colors.primary.default, marginTop: 24 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSelectImage = () => {
    // Show options to select image from camera or gallery
    setImagePickerModalVisible(true);
  };

  const takePhotoFromCamera = () => {
    setImagePickerModalVisible(false);

    ImagePicker.openCamera({
      width: 1200,
      height: 1200,
      cropping: true,
      compressImageQuality: 0.8,
    })
      .then(image => {
        console.log('Camera image:', image);
        setImage(image.path);
      })
      .catch(error => {
        if (error.code !== 'E_PICKER_CANCELLED') {
          console.error('Error capturing image:', error);
          Alert.alert('Error', 'Failed to capture image. Please try again.');
        }
      });
  };

  const choosePhotoFromGallery = () => {
    setImagePickerModalVisible(false);

    ImagePicker.openPicker({
      width: 1200,
      height: 1200,
      cropping: true,
      compressImageQuality: 0.8,
    })
      .then(image => {
        console.log('Gallery image:', image);
        setImage(image.path);
      })
      .catch(error => {
        if (error.code !== 'E_PICKER_CANCELLED') {
          console.error('Error selecting image:', error);
          Alert.alert('Error', 'Failed to select image. Please try again.');
        }
      });
  };

  const handleToggleParticipant = (userId) => {
    if (participants.includes(userId)) {
      setParticipants(participants.filter((id) => id !== userId));
    } else {
      setParticipants([...participants, userId]);
    }
  };

  const handleAddExpense = async () => {
    if (!amount || !description || participants.length === 0) {
      Alert.alert('Missing Information', 'Please fill in all required fields and select at least one participant.');
      return;
    }

    if (!category) {
      Alert.alert('Missing Category', 'Please select a category for this expense.');
      return;
    }

    if (!paidBy) {
      Alert.alert('Missing Information', 'Please select who paid for this expense.');
      return;
    }

    if (!userProfile || !userProfile.id) {
      Alert.alert('Error', 'You must be logged in to add an expense.');
      return;
    }

    // Validate custom splits if using unequal splitting
    if (splitType === 'unequal') {
      const totalPercentage = Object.values(customSplits).reduce((sum, value) => sum + value, 0);
      if (Math.abs(totalPercentage - 100) > 0.1) { // Allow small floating point errors
        Alert.alert('Invalid Split', 'The total percentage must equal 100%.');
        return;
      }

      // Also validate that total amount matches
      const totalCustomAmount = Object.values(customAmounts).reduce((sum, value) => sum + (value || 0), 0);
      if (Math.abs(totalCustomAmount - parseFloat(amount)) > 0.1) {
        Alert.alert(
          'Amount Mismatch',
          `The sum of individual amounts (₹${totalCustomAmount.toFixed(2)}) doesn't match the total expense amount (₹${parseFloat(amount).toFixed(2)}).`,
          [
            {
              text: 'Fix Automatically',
              onPress: () => {
                // Adjust the amounts proportionally to match the total
                const newAmounts = {};
                const factor = parseFloat(amount) / totalCustomAmount;

                Object.keys(customAmounts).forEach(id => {
                  newAmounts[id] = (customAmounts[id] || 0) * factor;
                });

                setCustomAmounts(newAmounts);
                Alert.alert('Amounts Adjusted', 'Individual amounts have been adjusted to match the total.');
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
    }

    setLoading(true);

    try {
      // Create expense data object
      const expenseData = {
        groupId,
        amount: parseFloat(amount),
        description,
        category,
        date: date.toISOString(),
        paidBy: paidBy,
        participants: participants,
        splitType: splitType,
        customSplits: splitType === 'unequal' ? customSplits : null,
        customAmounts: splitType === 'unequal' ? customAmounts : null,
        createdAt: new Date().toISOString(),
        image: image || null,
      };

      // Add expense to Firestore
      const expenseId = await ExpenseService.createExpense(expenseData);
      console.log('Expense created with ID:', expenseId);

      // Create split payment records with 'pending' status for each participant
      try {
        await ExpenseService.createSplitPaymentRecords(expenseId, expenseData);
        console.log('Split payment records created successfully');
      } catch (splitError) {
        console.error('Error creating split payment records:', splitError);
        // Continue even if split payment creation fails
      }

      // Find the payer's name
      const payer = groupMembers.find(member => member.id === paidBy);
      const payerName = payer ? payer.name : 'A user';

      // Send notifications to all participants except the payer
      const participantsToNotify = participants.filter(userId => userId !== paidBy);

      if (participantsToNotify.length > 0) {
        try {
          // Send notifications in parallel
          await Promise.all(participantsToNotify.map(userId => {
            return NotificationService.createExpenseAddedNotification(
              userId,
              group.name,
              payerName,
              parseFloat(amount),
              description,
              groupId,
              expenseId
            );
          }));
          console.log(`Sent expense notifications to ${participantsToNotify.length} users`);
        } catch (notifError) {
          console.error('Error sending expense notifications:', notifError);
          // Continue even if notifications fail
        }
      }

      // Show success message
      Alert.alert(
        'Success',
        'Expense added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: themeColors.card }]}
            >
              <Icon name="arrow-back" size={22} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              Add New Expense
            </Text>
            <View style={styles.spacer} />
          </Animated.View>

          {/* Group Info */}
          <Animated.View
            entering={FadeInUp.duration(800).delay(100)}
            style={[styles.groupInfoCard, { backgroundColor: themeColors.card }]}
          >
            <View style={styles.groupAvatarContainer}>
              {group.avatar ? (
                <Image source={{ uri: group.avatar }} style={styles.groupAvatar} />
              ) : (
                <View style={[styles.groupAvatarPlaceholder, { backgroundColor: colors.primary.light }]}>
                  <Text style={styles.groupAvatarText}>{group.name.charAt(0)}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.groupName, { color: themeColors.text }]}>{group.name}</Text>
            <Text style={[styles.groupMembers, { color: themeColors.textSecondary }]}>
              {groupMembers.length} members
            </Text>
          </Animated.View>

          {/* Amount Section */}
          <Animated.View
            style={[styles.card, { backgroundColor: themeColors.card }]}
            entering={FadeInUp.duration(800).delay(200)}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Amount
            </Text>

            <View style={[styles.amountContainer, { backgroundColor: themeColors.inputBg }]}>
              <Text style={[styles.currencySymbol, { color: colors.primary.default }]}>
                ₹
              </Text>
              <TextInput
                style={[styles.amountInput, { color: themeColors.text }]}
                placeholder="0.00"
                placeholderTextColor={themeColors.placeholder}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </Animated.View>

          {/* Description Section */}
          <Animated.View
            entering={FadeInUp.duration(800).delay(300)}
            style={[styles.card, { backgroundColor: themeColors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Description
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: themeColors.inputBg }]}>
              <Icon name="create-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="What's it for?"
                placeholderTextColor={themeColors.placeholder}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </Animated.View>

          {/* Category Section */}
          <Animated.View
            entering={FadeInUp.duration(800).delay(400)}
            style={[styles.card, { backgroundColor: themeColors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Category
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {expenseCategories.map((cat, index) => {
                const isSelected = category === cat;
                const categoryBgColor = isSelected
                  ? colors.primary.default
                  : themeColors.inputBg;

                const categoryTextColor = isSelected
                  ? colors.white
                  : themeColors.textSecondary;

                return (
                  <Animated.View
                    key={cat}
                    entering={SlideInRight.delay(400 + index * 50).duration(500)}
                  >
                    <TouchableOpacity
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor: categoryBgColor,
                          borderWidth: isSelected ? 0 : 1,
                          borderColor: themeColors.border
                        }
                      ]}
                    >
                      {/* We would use real category icons in a production app */}
                      <Icon
                        name={getCategoryIcon(cat)}
                        size={20}
                        color={isSelected ? colors.white : colors.primary.default}
                        style={styles.categoryIcon}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          {
                            color: categoryTextColor,
                            fontWeight: isSelected ? '600' : 'normal'
                          }
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>



          {/* Date Section */}
          <Animated.View
            entering={FadeInUp.duration(800).delay(500)}
            style={[styles.card, { backgroundColor: themeColors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Date
            </Text>

            <TouchableOpacity
              onPress={() => setDatePickerOpen(true)}
              style={[styles.dateButton, { backgroundColor: themeColors.inputBg }]}
            >
              <Icon name="calendar-outline" size={20} color={colors.primary.default} />
              <Text style={[styles.dateText, { color: themeColors.text }]}>
                {date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Icon name="chevron-down" size={18} color={themeColors.textSecondary} style={styles.dateIcon} />
            </TouchableOpacity>

            <DatePicker
              modal
              open={datePickerOpen}
              date={date}
              mode="date"
              maximumDate={new Date()}
              onConfirm={(selectedDate) => {
                setDatePickerOpen(false);
                setDate(selectedDate);
              }}
              onCancel={() => {
                setDatePickerOpen(false);
              }}
            />
          </Animated.View>

          {/* Receipt Section */}
          <Animated.View
            entering={FadeInUp.duration(800).delay(600)}
            style={[styles.card, { backgroundColor: themeColors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Receipt Photo
            </Text>

            <TouchableOpacity
              onPress={handleSelectImage}
              style={[
                styles.receiptButton,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: image ? 'transparent' : themeColors.border,
                  height: image ? 200 : 120
                }
              ]}
            >
              {image ? (
                <>
                  <Image
                    source={{ uri: image }}
                    style={styles.receiptImage}
                    resizeMode="cover"
                  />
                  <View style={styles.receiptOverlay}>
                    <TouchableOpacity
                      style={styles.editReceiptButton}
                      onPress={handleSelectImage}
                    >
                      <Icon name="camera" size={20} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeReceiptButton}
                      onPress={() => setImage(null)}
                    >
                      <Icon name="trash" size={20} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.receiptPlaceholder}>
                  <View style={styles.receiptIconContainer}>
                    <Icon
                      name="camera"
                      size={28}
                      color={colors.white}
                    />
                  </View>
                  <Text style={[styles.receiptText, { color: themeColors.textSecondary }]}>
                    Add receipt photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Paid By Section */}
          <Animated.View
            entering={FadeInUp.duration(800).delay(625)}
            style={[styles.card, { backgroundColor: themeColors.card }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Paid By
              </Text>
              {!paidBy && (
                <Text style={[styles.requiredField, { color: colors.error }]}>
                  * Required
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setPaidByModalVisible(true)}
              style={[
                styles.dateButton,
                {
                  backgroundColor: themeColors.inputBg,
                  borderWidth: !paidBy ? 1 : 0,
                  borderColor: !paidBy ? colors.error : 'transparent',
                  borderStyle: !paidBy ? 'dashed' : 'solid'
                }
              ]}
            >
              <Icon
                name="person-outline"
                size={20}
                color={!paidBy ? colors.error : colors.primary.default}
              />
              <Text
                style={[
                  styles.dateText,
                  {
                    color: !paidBy ? colors.error : themeColors.text,
                    fontStyle: !paidBy ? 'italic' : 'normal'
                  }
                ]}
              >
                {groupMembers.find(member => member.id === paidBy)?.name || 'Select who paid for this expense'}
              </Text>
              <Icon
                name="chevron-down"
                size={18}
                color={!paidBy ? colors.error : themeColors.textSecondary}
                style={styles.dateIcon}
              />
            </TouchableOpacity>

            {/* Paid By Modal */}
            <Modal
              visible={paidByModalVisible}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setPaidByModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setPaidByModalVisible(false)}
              >
                <View
                  style={[styles.modalContent, { backgroundColor: themeColors.card }]}
                  onStartShouldSetResponder={() => true}
                >
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: themeColors.text }]}>Who paid?</Text>
                    <TouchableOpacity onPress={() => setPaidByModalVisible(false)}>
                      <Icon name="close" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalScrollView}>
                    {groupMembers.map(member => (
                      <TouchableOpacity
                        key={member.id}
                        style={[
                          styles.memberItem,
                          paidBy === member.id && {
                            backgroundColor: colors.primary.light,
                            borderColor: colors.primary.default
                          }
                        ]}
                        onPress={() => {
                          setPaidBy(member.id);
                          setPaidByModalVisible(false);
                        }}
                      >
                        <Avatar
                          source={member.avatar}
                          name={member.name}
                          size="sm"
                        />
                        <Text style={[
                          styles.memberName,
                          { color: themeColors.text },
                          paidBy === member.id && { fontWeight: 'bold', color: colors.primary.default }
                        ]}>
                          {member.name}
                        </Text>
                        {paidBy === member.id && (
                          <Icon name="checkmark-circle" size={20} color={colors.primary.default} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </Animated.View>

          {/* Split Type Section */}
          <Animated.View
            entering={FadeInUp.duration(800).delay(650)}
            style={[styles.card, { backgroundColor: themeColors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Split Type
            </Text>

            <View style={styles.splitTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.splitTypeButton,
                  splitType === 'equal' && {
                    backgroundColor: colors.primary.light,
                    borderColor: colors.primary.default
                  },
                  { borderColor: themeColors.border }
                ]}
                onPress={() => setSplitType('equal')}
              >
                <Icon
                  name="reorder-four-outline"
                  size={20}
                  color={splitType === 'equal' ? colors.primary.default : themeColors.textSecondary}
                />
                <Text style={[
                  styles.splitTypeText,
                  { color: themeColors.text },
                  splitType === 'equal' && { fontWeight: 'bold', color: colors.primary.default }
                ]}>
                  Equal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.splitTypeButton,
                  splitType === 'unequal' && {
                    backgroundColor: colors.primary.light,
                    borderColor: colors.primary.default
                  },
                  { borderColor: themeColors.border }
                ]}
                onPress={() => setSplitType('unequal')}
              >
                <Icon
                  name="options-outline"
                  size={20}
                  color={splitType === 'unequal' ? colors.primary.default : themeColors.textSecondary}
                />
                <Text style={[
                  styles.splitTypeText,
                  { color: themeColors.text },
                  splitType === 'unequal' && { fontWeight: 'bold', color: colors.primary.default }
                ]}>
                  Unequal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.splitTypeButton,
                  splitType === 'group' && {
                    backgroundColor: colors.primary.light,
                    borderColor: colors.primary.default
                  },
                  { borderColor: themeColors.border }
                ]}
                onPress={() => setSplitType('group')}
              >
                <Icon
                  name="people-outline"
                  size={20}
                  color={splitType === 'group' ? colors.primary.default : themeColors.textSecondary}
                />
                <Text style={[
                  styles.splitTypeText,
                  { color: themeColors.text },
                  splitType === 'group' && { fontWeight: 'bold', color: colors.primary.default }
                ]}>
                  By Group
                </Text>
                {splitType === 'group' && (
                  <Text style={[styles.splitTypeDescription, { color: themeColors.textSecondary }]}>
                    (Coming soon)
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Participants Section */}
          <Animated.View
            entering={FadeInUp.duration(800).delay(700)}
            style={[styles.card, { backgroundColor: themeColors.card }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Split With
              </Text>
              <Text style={[styles.selectedCount, { color: colors.primary.default }]}>
                {participants.length}/{groupMembers.length} Selected
              </Text>
            </View>

            <View style={styles.participantsContainer}>
              {groupMembers.map((member, index) => {
                const isSelected = participants.includes(member.id);
                const percentShare = customSplits[member.id] || 0;

                return (
                  <Animated.View
                    key={member.id}
                    entering={FadeInUp.delay(700 + index * 100).duration(500)}
                  >
                    <View
                      style={[
                        styles.participantRow,
                        index < groupMembers.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: themeColors.border
                        }
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleToggleParticipant(member.id)}
                        style={[
                          styles.participantInfo,
                          { flex: splitType === 'unequal' && isSelected ? 0.7 : 1 }
                        ]}
                      >
                        <View style={[styles.avatarContainer, isSelected && styles.selectedAvatarContainer]}>
                          <Avatar source={member.avatar} name={member.name} size="md" />
                          {isSelected && (
                            <View style={styles.checkmarkBadge}>
                              <Icon name="checkmark" size={12} color={colors.white} />
                            </View>
                          )}
                        </View>
                        <View>
                          <View style={styles.nameContainer}>
                            <Text style={[styles.participantName, { color: themeColors.text }]}>
                              {member.id === userProfile?.id ? 'Me' : member.name}
                            </Text>

                            {/* Show "Paid" label if this member is the payer */}
                            {member.id === paidBy && (
                              <View style={[styles.paidBadge, { backgroundColor: colors.success }]}>
                                <Text style={styles.paidBadgeText}>Paid</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.participantEmail, { color: themeColors.textSecondary }]}>
                            {member.id === userProfile?.id ? 'You' : (member.phoneNumber || 'No phone')}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Show amount/percentage input for unequal split */}
                      {splitType === 'unequal' && isSelected && (
                        <View style={styles.splitInputContainer}>
                          {/* Amount input */}
                          <View style={styles.amountInputContainer}>
                            <Text style={[styles.currencySymbolSmall, { color: themeColors.textSecondary }]}>₹</Text>
                            <TextInput
                              style={[
                                styles.amountInputSmall,
                                {
                                  color: themeColors.text,
                                  backgroundColor: themeColors.inputBg,
                                  borderColor: themeColors.border
                                }
                              ]}
                              value={(customAmounts[member.id] || '').toString()}
                              onChangeText={(text) => {
                                const newValue = parseFloat(text) || 0;

                                // Update the amount for this member
                                setCustomAmounts({
                                  ...customAmounts,
                                  [member.id]: newValue
                                });

                                // Calculate percentage based on total amount
                                if (amount && parseFloat(amount) > 0) {
                                  const percentage = (newValue / parseFloat(amount)) * 100;
                                  setCustomSplits({
                                    ...customSplits,
                                    [member.id]: parseFloat(percentage.toFixed(1))
                                  });
                                }
                              }}
                              keyboardType="numeric"
                              placeholder="0.00"
                              placeholderTextColor={themeColors.placeholder}
                            />
                          </View>

                          {/* Percentage display */}
                          <View style={styles.percentContainer}>
                            <Text style={[styles.percentValue, { color: themeColors.textSecondary }]}>
                              {amount && parseFloat(amount) > 0
                                ? `${percentShare.toFixed(1)}%`
                                : '-%'}
                            </Text>
                          </View>
                        </View>
                      )}

                      {splitType !== 'unequal' && (
                        <View
                          style={[
                            styles.checkboxContainer,
                            {
                              borderColor: isSelected ? colors.primary.default : themeColors.border,
                              backgroundColor: isSelected ? colors.primary.default : 'transparent'
                            }
                          ]}
                        >
                          {isSelected && (
                            <Icon name="checkmark" size={16} color={colors.white} />
                          )}
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              }).filter(Boolean)}
            </View>

            {/* Show total amount and percentage for unequal split */}
            {splitType === 'unequal' && (
              <View style={styles.totalContainer}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>
                    Total Amount:
                  </Text>
                  <Text style={[styles.totalValue, { color: themeColors.text }]}>
                    ₹{Object.values(customAmounts).reduce((sum, value) => sum + (value || 0), 0).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>
                    Total Percentage:
                  </Text>
                  <Text
                    style={[
                      styles.totalValue,
                      {
                        color: Math.abs(Object.values(customSplits).reduce((sum, value) => sum + value, 0) - 100) > 0.1
                          ? colors.error
                          : colors.success
                      }
                    ]}
                  >
                    {Object.values(customSplits).reduce((sum, value) => sum + value, 0).toFixed(1)}%
                  </Text>
                </View>

                {Math.abs(Object.values(customSplits).reduce((sum, value) => sum + value, 0) - 100) > 0.1 && (
                  <Text style={[styles.totalPercentWarning, { color: colors.error }]}>
                    Note: Total percentage should equal 100%
                  </Text>
                )}

                {Math.abs(Object.values(customAmounts).reduce((sum, value) => sum + (value || 0), 0) - parseFloat(amount || 0)) > 0.1 && (
                  <Text style={[styles.totalPercentWarning, { color: colors.error }]}>
                    Note: Total amount should equal ₹{parseFloat(amount || 0).toFixed(2)}
                  </Text>
                )}
              </View>
            )}
          </Animated.View>

          {/* Submit Button */}
          <Animated.View style={styles.buttonContainer} entering={FadeInUp.duration(800).delay(800)}>
            <Button
              title={loading ? "Adding..." : "Add Expense"}
              onPress={handleAddExpense}
              loading={loading}
              disabled={!amount || !description || !paidBy || participants.length === 0}
              fullWidth
              size="lg"
              icon={loading ? null : "checkmark-circle"}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <Modal
        visible={imagePickerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImagePickerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImagePickerModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Photo</Text>

            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: themeColors.border }]}
              onPress={takePhotoFromCamera}
            >
              <Icon name="camera-outline" size={24} color={colors.primary.default} style={styles.modalOptionIcon} />
              <Text style={[styles.modalOptionText, { color: themeColors.text }]}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={choosePhotoFromGallery}
            >
              <Icon name="image-outline" size={24} color={colors.primary.default} style={styles.modalOptionIcon} />
              <Text style={[styles.modalOptionText, { color: themeColors.text }]}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: themeColors.border }]}
              onPress={() => setImagePickerModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// Helper function to get category icons (in a real app, this would be part of the data)
const getCategoryIcon = (category) => {
  const iconMap = {
    'Food': 'restaurant',
    'Transport': 'car',
    'Shopping': 'cart',
    'Entertainment': 'film',
    'Groceries': 'basket',
    'Bills': 'receipt',
    'Travel': 'airplane',
    'Health': 'medical',
    'Education': 'school',
    'Other': 'apps',
  };

  return iconMap[category] || 'apps';
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
  },
  spacer: {
    width: 40,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  groupInfoCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  groupAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  groupAvatar: {
    width: '100%',
    height: '100%',
  },
  groupAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarText: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: colors.white,
  },
  groupName: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  groupMembers: {
    fontSize: fontSizes.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectedCount: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  currencySymbol: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    paddingVertical: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    paddingVertical: spacing.sm,
  },
  categoriesContainer: {
    marginBottom: spacing.sm,
  },
  categoriesContent: {
    paddingVertical: spacing.xs,
  },
  categoryButton: {
    marginRight: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 9999, // rounded-full
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryIcon: {
    marginRight: spacing.xs,
  },
  categoryText: {
    fontSize: fontSizes.base,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  dateText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  dateIcon: {
    marginLeft: spacing.sm,
  },
  receiptButton: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  receiptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  editReceiptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  removeReceiptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  receiptPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  receiptIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  receiptText: {
    fontSize: fontSizes.base,
  },
  participantsContainer: {
    borderRadius: borderRadius.lg,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  paidBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  paidBadgeText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  splitInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    height: 36,
  },
  currencySymbolSmall: {
    fontSize: fontSizes.sm,
    marginRight: 2,
  },
  amountInputSmall: {
    width: 60,
    height: 36,
    textAlign: 'right',
    fontSize: fontSizes.sm,
  },
  percentContainer: {
    marginLeft: spacing.xs,
    width: 50,
    alignItems: 'center',
  },
  percentValue: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  totalContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  totalPercentWarning: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  requiredField: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  splitTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  splitTypeText: {
    marginLeft: spacing.xs,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  splitTypeDescription: {
    fontSize: fontSizes.xs,
    fontStyle: 'italic',
    position: 'absolute',
    bottom: -12,
    width: '100%',
    textAlign: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
    position: 'relative',
  },
  selectedAvatarContainer: {
    opacity: 1,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  participantName: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: fontSizes.xs,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: spacing.lg,
    marginBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
  },
  backButtonLarge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalOptionIcon: {
    marginRight: spacing.md,
  },
  modalOptionText: {
    fontSize: fontSizes.md,
  },
  cancelButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  memberName: {
    fontSize: fontSizes.md,
    marginLeft: spacing.md,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalScrollView: {
    maxHeight: 300,
  },
});

export default AddExpenseScreen;