import React, { useState, useRef } from 'react';
import { View, Text, Image, FlatList, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Welcome to VitSplit',
    description: 'The easiest way to split expenses with friends and family.',
    image: { uri: 'https://img.freepik.com/free-vector/friends-giving-high-five_23-2148363170.jpg' },
  },
  {
    id: '2',
    title: 'Create Groups',
    description: 'Create groups for trips, roommates, or any shared expenses.',
    image: { uri: 'https://img.freepik.com/free-vector/diverse-crowd-people-different-ages-races_74855-5235.jpg' },
  },
  {
    id: '3',
    title: 'Track Expenses',
    description: 'Add expenses and see who owes what in real-time.',
    image: { uri: 'https://img.freepik.com/free-vector/finance-financial-performance-concept-illustration_53876-40450.jpg' },
  },
  {
    id: '4',
    title: 'Settle Up',
    description: 'Easily settle debts and keep track of payments.',
    image: { uri: 'https://img.freepik.com/free-vector/payment-information-concept-illustration_114360-2766.jpg' },
  },
];

const OnboardingScreen = () => {
  const { login } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Complete onboarding and navigate to login screen
      // The login function will handle setting hasLaunched and triggering navigation
      login();
    }
  };

  const handleSkip = async () => {
    // Skip onboarding and navigate to login screen
    // The login function will handle setting hasLaunched and triggering navigation
    login();
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.imageContainer}>
          <Image
            source={item.image}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.title}>
          {item.title}
        </Text>

        <Text style={styles.description}>
          {item.description}
        </Text>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : styles.inactiveDot
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <View style={styles.skipContainer}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        {renderDots()}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>
              {currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#718096',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1A202C',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#718096',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#5E72E4',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#CBD5E0',
  },
  buttonContainer: {
    padding: 32,
  },
  button: {
    backgroundColor: '#5E72E4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
