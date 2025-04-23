import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getGroupById, expenseCategories } from '../../utils/mockData';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, fontSizes, borderRadius } from '../../theme/theme';

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

  if (!group) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Group not found</Text>
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
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? colors.dark.default : colors.light.default }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Animated.View
        style={styles.section}
        entering={FadeInUp.duration(800)}
      >
        <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.white : colors.dark.default }]}>
          Amount
        </Text>

        <View
          style={[styles.amountContainer, { backgroundColor: isDarkMode ? colors.dark.light : colors.white }]}
        >
          <Text style={[styles.currencySymbol, { color: isDarkMode ? colors.white : colors.dark.default }]}>
            $
          </Text>
          <TextInput
            style={[styles.amountInput, { color: isDarkMode ? colors.white : colors.dark.default }]}
            placeholder="0.00"
            placeholderTextColor={isDarkMode ? colors.gray[500] : colors.gray[600]}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(800).delay(100)}>
        <Input
          label="What's it for?"
          placeholder="Enter description"
          value={description}
          onChangeText={setDescription}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(800).delay(200)}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.white : colors.dark.default }]}>
          Category
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {expenseCategories.map((cat) => {
            const isSelected = category === cat;
            const categoryBgColor = isSelected
              ? colors.primary.default
              : isDarkMode
              ? colors.dark.light
              : colors.light.dark;

            const categoryTextColor = isSelected
              ? colors.white
              : isDarkMode
              ? colors.gray[300]
              : colors.gray[600];

            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.categoryButton, { backgroundColor: categoryBgColor }]}
              >
                <Text
                  style={[styles.categoryText, { color: categoryTextColor, fontWeight: isSelected ? '500' : 'normal' }]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(800).delay(300)}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.white : colors.dark.default }]}>
          Date
        </Text>

        <TouchableOpacity
          style={[styles.dateButton, { backgroundColor: isDarkMode ? colors.dark.light : colors.white }]}
        >
          <Icon name="calendar-outline" size={20} color={isDarkMode ? colors.gray[500] : colors.gray[600]} />
          <Text style={[styles.dateText, { color: isDarkMode ? colors.white : colors.dark.default }]}>
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(800).delay(400)}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.white : colors.dark.default }]}>
          Add Receipt (Optional)
        </Text>

        <TouchableOpacity
          onPress={handleSelectImage}
          style={[
            styles.receiptButton,
            {
              borderColor: isDarkMode ? colors.gray[600] : colors.gray[300],
              height: image ? 192 : 96 // 48 or 24 * 4
            }
          ]}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.receiptImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.receiptPlaceholder}>
              <Icon
                name="image-outline"
                size={32}
                color={isDarkMode ? colors.gray[500] : colors.gray[600]}
                style={styles.receiptIcon}
              />
              <Text style={{ color: isDarkMode ? colors.gray[300] : colors.gray[600] }}>
                Tap to add receipt
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(800).delay(500)}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.white : colors.dark.default }]}>
          Participants
        </Text>

        <View
          style={[styles.participantsContainer, { backgroundColor: isDarkMode ? colors.dark.light : colors.white }]}
        >
          {group.members.map((member) => (
            <TouchableOpacity
              key={member.id}
              onPress={() => handleToggleParticipant(member.id)}
              style={styles.participantRow}
            >
              <View style={styles.participantInfo}>
                <Avatar source={member.avatar} name={member.name} size="sm" />
                <Text style={[styles.participantName, { color: isDarkMode ? colors.white : colors.dark.default }]}>
                  {member.name}
                </Text>
              </View>

              <View
                style={[
                  styles.checkboxContainer,
                  {
                    backgroundColor: participants.includes(member.id)
                      ? colors.primary.default
                      : isDarkMode
                      ? colors.gray[600]
                      : colors.gray[300]
                  }
                ]}
              >
                {participants.includes(member.id) && (
                  <Icon name="checkmark" size={16} color={colors.white} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={styles.buttonContainer} entering={FadeInUp.duration(800).delay(600)}>
        <Button
          title="Add Expense"
          onPress={handleAddExpense}
          loading={loading}
          disabled={!amount || !description || participants.length === 0}
          fullWidth
          size="lg"
        />
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.dark.default,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
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
  },
  categoriesContainer: {
    marginBottom: spacing.lg,
  },
  categoryButton: {
    marginRight: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 9999, // rounded-full
  },
  categoryText: {
    fontSize: fontSizes.base,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  dateText: {
    marginLeft: spacing.sm,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  receiptPlaceholder: {
    alignItems: 'center',
  },
  receiptIcon: {
    marginBottom: spacing.sm,
  },
  participantsContainer: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    marginLeft: spacing.md,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginBottom: spacing.lg,
  },
});

export default AddExpenseScreen;
