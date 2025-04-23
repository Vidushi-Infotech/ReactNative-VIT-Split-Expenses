import React, { useState } from 'react';
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
  KeyboardAvoidingView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getGroupById, expenseCategories } from '../../utils/mockData';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp, FadeIn, SlideInRight } from 'react-native-reanimated';
import { colors, spacing, fontSizes, borderRadius } from '../../theme/theme';
import { BlurView } from '@react-native-community/blur';

const AddExpenseScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  const { groupId } = route.params;
  const group = getGroupById(groupId);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [image, setImage] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

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

  if (!group) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.text, { color: themeColors.text }]}>Group not found</Text>
      </View>
    );
  }

  const handleSelectImage = () => {
    // In a real app, we would use react-native-image-picker here
    // For demo purposes, we'll just set a random image
    const demoImages = [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
      'https://images.unsplash.com/photo-1607434472257-d9f8e57a643d',
      'https://images.unsplash.com/photo-1526948531399-320e7e40f0ca',
    ];
    const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];
    setImage(randomImage);
  };

  const handleToggleParticipant = (userId) => {
    if (participants.includes(userId)) {
      setParticipants(participants.filter((id) => id !== userId));
    } else {
      setParticipants([...participants, userId]);
    }
  };

  const handleAddExpense = () => {
    if (!amount || !description || participants.length === 0) {
      // Show error in a real app
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 1500);
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
              {group.members.length} members
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
              style={[styles.dateButton, { backgroundColor: themeColors.inputBg }]}
            >
              <Icon name="calendar-outline" size={20} color={colors.primary.default} />
              <Text style={[styles.dateText, { color: themeColors.text }]}>
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Icon name="chevron-down" size={18} color={themeColors.textSecondary} style={styles.dateIcon} />
            </TouchableOpacity>
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
                {participants.length}/{group.members.length} Selected
              </Text>
            </View>

            <View style={styles.participantsContainer}>
              {group.members.map((member, index) => {
                const isSelected = participants.includes(member.id);

                return (
                  <Animated.View
                    key={member.id}
                    entering={FadeInUp.delay(700 + index * 100).duration(500)}
                  >
                    <TouchableOpacity
                      onPress={() => handleToggleParticipant(member.id)}
                      style={[
                        styles.participantRow,
                        index < group.members.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: themeColors.border
                        }
                      ]}
                    >
                      <View style={styles.participantInfo}>
                        <View style={[styles.avatarContainer, isSelected && styles.selectedAvatarContainer]}>
                          <Avatar source={member.avatar} name={member.name} size="md" />
                          {isSelected && (
                            <View style={styles.checkmarkBadge}>
                              <Icon name="checkmark" size={12} color={colors.white} />
                            </View>
                          )}
                        </View>
                        <View>
                          <Text style={[styles.participantName, { color: themeColors.text }]}>
                            {member.name}
                          </Text>
                          <Text style={[styles.participantEmail, { color: themeColors.textSecondary }]}>
                            {member.email || 'No email'}
                          </Text>
                        </View>
                      </View>

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
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View style={styles.buttonContainer} entering={FadeInUp.duration(800).delay(800)}>
            <Button
              title={loading ? "Adding..." : "Add Expense"}
              onPress={handleAddExpense}
              loading={loading}
              disabled={!amount || !description || participants.length === 0}
              fullWidth
              size="lg"
              icon={loading ? null : "checkmark-circle"}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
});

export default AddExpenseScreen;