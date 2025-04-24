import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { countryCodes } from '../../utils/countryCodesData';
import { spacing, fontSizes, borderRadius } from '../../theme/theme';

// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CountryCodePicker = ({ selectedCountry, onSelectCountry, themeColors }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = searchQuery
    ? countryCodes.filter(
        country =>
          country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.code.includes(searchQuery)
      )
    : countryCodes;

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        onSelectCountry(item);
        setModalVisible(false);
      }}
    >
      <View style={styles.countryInfoContainer}>
        <Text style={styles.flagText}>{item.flag}</Text>
        <Text style={[styles.countryName, { color: themeColors.text }]}>
          {item.country}
        </Text>
      </View>
      <Text style={[styles.countryCode, { color: themeColors.textSecondary }]}>
        {item.code}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.pickerButton, { backgroundColor: themeColors.surface }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectedCountryContainer}>
          <Text style={styles.flagText}>{selectedCountry.flag}</Text>
          <Text style={[styles.selectedCode, { color: themeColors.text }]}>
            {selectedCountry.code}
          </Text>
        </View>
        <Icon name="chevron-down" size={16} color={themeColors.textSecondary} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Select Country
            </Text>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: themeColors.surface }]}>
            <Icon name="search" size={20} color={themeColors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search country or code"
              placeholderTextColor={themeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.listContainer}>
            <FlatList
              data={filteredCountries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.country}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: themeColors.border }]} />
              )}
              contentContainerStyle={styles.listContentContainer}
              showsVerticalScrollIndicator={true}
              bounces={true}
              style={styles.flatList}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    minWidth: 90,
  },
  selectedCountryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCode: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  flagText: {
    fontSize: fontSizes.lg,
    marginRight: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    height: SCREEN_HEIGHT,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    marginLeft: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.md,
    marginLeft: spacing.sm,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  countryInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryName: {
    fontSize: fontSizes.md,
    marginLeft: spacing.sm,
    flex: 1,
  },
  countryCode: {
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  separator: {
    height: 1,
  },
  listContainer: {
    flex: 1,
    width: '100%',
  },
  flatList: {
    flex: 1,
    width: '100%',
  },
  listContentContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
});

export default CountryCodePicker;
