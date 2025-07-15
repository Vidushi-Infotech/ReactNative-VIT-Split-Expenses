import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const Dropdown = ({
  label,
  placeholder,
  value,
  onSelect,
  options = [],
  style,
  error,
  renderItem,
  keyExtractor,
  displayKey = 'label',
  valueKey = 'value',
}) => {
  const {theme} = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const handleSelect = item => {
    onSelect(item);
    setIsVisible(false);
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    if (typeof value === 'string') return value;
    return value[displayKey] || value.name || value.label || value;
  };

  const styles = createStyles(theme);

  const defaultRenderItem = ({item}) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => handleSelect(item)}>
      <View style={styles.optionContent}>
        {item.emoji && <Text style={styles.optionEmoji}>{item.emoji}</Text>}
        {item.icon && <Text style={styles.optionIcon}>{item.icon}</Text>}
        <Text style={styles.optionText}>
          {item[displayKey] || item.name || item.label || item}
        </Text>
        {item.code && <Text style={styles.optionCode}>{item.code}</Text>}
      </View>
      {value && (value[valueKey] || value) === (item[valueKey] || item) && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.dropdown, error && styles.dropdownError]}
        onPress={() => setIsVisible(true)}>
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {getDisplayValue()}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIsVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              renderItem={renderItem ? (props) => renderItem({...props, onSelect: handleSelect}) : defaultRenderItem}
              keyExtractor={
                keyExtractor ||
                ((item, index) =>
                  item[valueKey] || item.id || item.value || index.toString())
              }
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const createStyles = theme =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 8,
    },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      minHeight: 48,
    },
    dropdownError: {
      borderColor: theme.colors.error,
    },
    dropdownText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    placeholderText: {
      color: theme.colors.textMuted,
    },
    dropdownArrow: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      width: '80%',
      maxHeight: '60%',
      elevation: 8,
      shadowColor: theme.colors.text,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      fontWeight: 'bold',
    },
    optionsList: {
      maxHeight: 300,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionEmoji: {
      fontSize: 20,
      marginRight: 12,
    },
    optionIcon: {
      fontSize: 16,
      marginRight: 12,
    },
    optionText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    optionCode: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    checkmark: {
      fontSize: 16,
      color: theme.colors.success,
      fontWeight: 'bold',
    },
  });

export default Dropdown;
