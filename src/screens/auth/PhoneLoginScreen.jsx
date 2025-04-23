import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
  Dimensions,
  Animated,
  PanResponder
} from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';
import { FadeInUp } from 'react-native-reanimated';

// Mock country codes - same as before
const countryCodes = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_POINTS = {
  BOTTOM: 0,
  MIDDLE: SCREEN_HEIGHT * 0.5,
  FULL: SCREEN_HEIGHT * 0.9
};

const PhoneLoginScreen = ({ navigation }) => {
  const { colors: themeColors } = useTheme();
  const { sendOTP } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(countryCodes);
  const searchInputRef = useRef(null);

  // Animation values
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const activeSnapPoint = useRef(SNAP_POINTS.MIDDLE);

  const handleSendOTP = async () => {
    setError('');

    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      // Use the sendOTP function from AuthContext
      const fullPhoneNumber = selectedCountry.code + phoneNumber;
      const success = sendOTP(fullPhoneNumber);

      if (success) {
        // Navigate to OTP verification screen
        navigation.navigate('OTPVerification', {
          phoneNumber: fullPhoneNumber,
        });
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
      console.error('Error sending OTP:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter countries based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCountries(countryCodes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = countryCodes.filter(
        country =>
          country.country.toLowerCase().includes(query) ||
          country.code.includes(query)
      );
      setFilteredCountries(filtered);
    }
  }, [searchQuery]);

  // Set up the pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, _gestureState) => {
        // Only respond to pan gestures on the handle area
        const { locationY } = evt.nativeEvent;
        return locationY < 60; // Approximate height of the handle + header
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to pan gestures on the handle area
        const { locationY } = evt.nativeEvent;
        return locationY < 60 && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Remember the current position
      },
      onPanResponderMove: (_event, gestureState) => {
        const dragY = Math.max(0, gestureState.dy);
        translateY.setValue(activeSnapPoint.current + dragY);
      },
      onPanResponderRelease: (_event, gestureState) => {
        const velocity = gestureState.vy;
        const currentPosition = translateY._value;

        // Define where to snap based on velocity and position
        if (velocity > 0.5) {
          // Swiping down fast - close
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();

          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            finishClosing();
          });
          return;
        }

        // Calculate which snap point is closest
        if (currentPosition > SNAP_POINTS.MIDDLE + 100) {
          // Close
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();

          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            finishClosing();
          });
        } else if (currentPosition < SNAP_POINTS.MIDDLE - 100) {
          // Expand to full
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();

          Animated.timing(translateY, {
            toValue: SNAP_POINTS.BOTTOM,
            duration: 300,
            useNativeDriver: true,
          }).start();
          activeSnapPoint.current = SNAP_POINTS.BOTTOM;
        } else {
          // Stay at middle
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();

          Animated.timing(translateY, {
            toValue: SNAP_POINTS.MIDDLE,
            duration: 300,
            useNativeDriver: true,
          }).start();
          activeSnapPoint.current = SNAP_POINTS.MIDDLE;
        }
      },
    })
  ).current;

  const openCountryModal = () => {
    Keyboard.dismiss();
    setSearchQuery('');
    setFilteredCountries(countryCodes);
    setShowCountryModal(true);
    translateY.setValue(SCREEN_HEIGHT);

    // Start animations
    Animated.timing(backdropOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(translateY, {
      toValue: SNAP_POINTS.MIDDLE,
      duration: 300,
      useNativeDriver: true,
    }).start();

    activeSnapPoint.current = SNAP_POINTS.MIDDLE;

    // Focus search input after animation
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 400);
  };

  const closeCountryModal = () => {
    Keyboard.dismiss();

    // Start animations
    Animated.timing(backdropOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      finishClosing();
    });
  };

  const finishClosing = () => {
    setShowCountryModal(false);
  };

  const selectCountry = (country) => {
    setSelectedCountry(country);
    closeCountryModal();
  };

  // Animated styles
  const bottomSheetStyle = {
    transform: [{ translateY: translateY }],
  };

  const backdropStyle = {
    opacity: backdropOpacity,
  };

  // Calculate the sheet height
  const maxSheetHeight = {
    height: SCREEN_HEIGHT * 0.8,
    maxHeight: SCREEN_HEIGHT * 0.9,
  };

  // Determine if we're on iOS
  const isIOS = Platform.OS === 'ios';

  return (
    <SafeAreaWrapper>
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInUp.duration(800).delay(200)}
          style={styles.header}
        >
          <Image
            source={{ uri: 'https://img.freepik.com/free-vector/mobile-login-concept-illustration_114360-83.jpg' }}
            style={styles.headerImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: themeColors.text }]}>Login with Phone</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            We'll send you a one-time verification code to verify your phone number
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(800).delay(400)}
          style={styles.form}
        >
          <Text style={[styles.label, { color: themeColors.text }]}>Phone Number</Text>

          {error ? (
            <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
          ) : null}

          <View style={[styles.phoneInputContainer, {
            backgroundColor: themeColors.surface,
            borderColor: error ? themeColors.danger : themeColors.border
          }]}>
            {/* Country Code Selector */}
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={openCountryModal}
              activeOpacity={0.7}
            >
              <Text style={[styles.countryFlag, { color: themeColors.text }]}>
                {selectedCountry.flag}
              </Text>
              <Text style={[styles.countryCode, { color: themeColors.text }]}>
                {selectedCountry.code}
              </Text>
              <Icon
                name="chevron-down"
                size={16}
                color={themeColors.textSecondary}
              />
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

            {/* Phone Number Input */}
            <TextInput
              style={[styles.phoneInput, { color: themeColors.text }]}
              placeholder="Enter your phone number"
              placeholderTextColor={themeColors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: phoneNumber.length < 10
                  ? `${themeColors.primary.default}80`
                  : themeColors.primary.default
              }
            ]}
            onPress={handleSendOTP}
            disabled={loading || phoneNumber.length < 10}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.termsText, { color: themeColors.textSecondary }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>

        {/* Country Selection Bottom Sheet Modal */}
        {showCountryModal && (
          <>
            <Animated.View
              style={[
                styles.bottomSheetOverlay,
                { backgroundColor: 'rgba(0,0,0,0.5)' },
                backdropStyle
              ]}
            >
              <TouchableOpacity
                style={styles.backdropTouchable}
                activeOpacity={1}
                onPress={closeCountryModal}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.bottomSheet,
                bottomSheetStyle,
                maxSheetHeight,
                { backgroundColor: themeColors.surface }
              ]}
            >
                {/* Drag handle area - this is where pan responder is attached */}
                <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
                  <View style={styles.handleContainer}>
                    <View style={[styles.bottomSheetHandle, { backgroundColor: themeColors.border }]} />
                  </View>

                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Country</Text>
                    <TouchableOpacity
                      onPress={closeCountryModal}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Icon name="close" size={24} color={themeColors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.searchContainer, { backgroundColor: themeColors.mode === 'dark' ? themeColors.surface : themeColors.background }]}>
                  <Icon
                    name="search-outline"
                    size={20}
                    color={themeColors.textSecondary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    ref={searchInputRef}
                    style={[styles.searchInput, { color: themeColors.text }]}
                    placeholder="Search country or code"
                    placeholderTextColor={themeColors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                  />
                  {searchQuery.length > 0 && Platform.OS === 'android' && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Icon name="close-circle" size={18} color={themeColors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.countryListContainer}>
                  {filteredCountries.length === 0 ? (
                    <View style={styles.noResultsContainer}>
                      <Icon
                        name="search-outline"
                        size={48}
                        color={themeColors.textSecondary}
                        style={styles.noResultsIcon}
                      />
                      <Text style={[styles.noResultsText, { color: themeColors.textSecondary }]}>
                        No countries found
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.countryList}
                      contentContainerStyle={styles.countryListContent}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                      showsVerticalScrollIndicator={true}
                      indicatorStyle={themeColors.mode === 'dark' ? 'white' : 'black'}
                      nestedScrollEnabled={true}
                      bounces={true}
                      alwaysBounceVertical={isIOS}
                      scrollEventThrottle={16}
                      overScrollMode={Platform.OS === 'android' ? 'always' : undefined}
                    >
                      {filteredCountries.map((country) => (
                        <TouchableOpacity
                          key={country.code}
                          style={[
                            styles.countryItem,
                            selectedCountry.code === country.code && {
                              backgroundColor: `${themeColors.primary.default}15`
                            }
                          ]}
                          onPress={() => selectCountry(country)}
                          activeOpacity={0.6}
                          android_ripple={Platform.OS === 'android' ? { color: `${themeColors.primary.default}30`, borderless: false } : null}
                        >
                          <Text style={styles.countryFlag}>{country.flag}</Text>
                          <Text style={[styles.countryName, { color: themeColors.text }]}>
                            {country.country}
                          </Text>
                          <Text style={[styles.countryCodeItem, {
                            color: selectedCountry.code === country.code
                              ? themeColors.primary.default
                              : themeColors.textSecondary
                          }]}>
                            {country.code}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </Animated.View>
            </>
          )}
        </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerImage: {
    width: '80%',
    height: 200,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.base,
    textAlign: 'center',
    marginHorizontal: spacing.xl,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  countryFlag: {
    fontSize: fontSizes.xl,
    marginRight: spacing.sm,
  },
  countryCode: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  divider: {
    width: 1,
    height: '70%',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.base,
  },
  button: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
  },
  bottomSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -20, // Ensure it extends past the bottom of the screen
    paddingBottom: 20, // Add padding at the bottom to compensate
    zIndex: 1001,
    elevation: 1001,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  dragHandleArea: {
    width: '100%',
  },
  handleContainer: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    marginVertical: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    paddingVertical: Platform.OS === 'ios' ? 0 : spacing.xs,
  },
  countryListContainer: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.6,
    minHeight: 200,
  },
  countryList: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
    height: '100%',
  },
  countryListContent: {
    paddingBottom: spacing.xxxl,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  noResultsIcon: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  noResultsText: {
    fontSize: fontSizes.base,
    opacity: 0.7,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: 4,
    backgroundColor: 'transparent',
  },
  countryName: {
    flex: 1,
    fontSize: fontSizes.base,
    marginLeft: spacing.md,
  },
  countryCodeItem: {
    fontSize: fontSizes.base,
    fontWeight: '500',
  },
});

export default PhoneLoginScreen;