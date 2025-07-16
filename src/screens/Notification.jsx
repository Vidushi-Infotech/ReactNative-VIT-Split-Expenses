import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';

const Notifications = ({onClose}) => {
  const {theme} = useTheme();
  const styles = createStyles(theme);

  const [isEnabled, setIsEnabled] = useState(false);
  const [notifymeOptions, setNotifyMeOptions] = useState([
    {
      id: 1,
      title: 'When I am added to a group',
      isEnabled: false,
    },
    {
      id: 2,
      title: 'When an expense is added',
      isEnabled: false,
    },
    {
      id: 3,
      title: 'When a payment is Settled',
      isEnabled: false,
    },
  ]);

  const toggleSwitch = () => setIsEnabled(prev => !prev);

  const toggleNotifyMeSwitch = id => {
    setNotifyMeOptions(prevOptions =>
      prevOptions.map(item =>
        item.id === id ? {...item, isEnabled: !item.isEnabled} : item,
      ),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme.colors.statusBarStyle}
        backgroundColor={theme.colors.statusBarBackground}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* Global Notification Toggle */}
        <View style={styles.row}>
          <Text style={styles.text}>Enable Notifications</Text>
          <Switch
            style={styles.switch}
            trackColor={{false: '#767577', true: '#1387c6cb'}}
            thumbColor={isEnabled ? '#f4f3f3ff' : '#f4f3f3ff'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        <Text style={styles.sectionTitle}>Notify Me</Text>

        {/* Per-notification Toggles */}
        {notifymeOptions.map(item => (
          <View key={item.id} style={styles.Subtext}>
            <Text
              style={[
                styles.SubtextTitle,
                !isEnabled && {color: theme.colors.textSecondary},
              ]}>
              {item.title}
            </Text>
            <Switch
              style={styles.SubtextSwitch}
              trackColor={{false: '#767577', true: '#1387c6cb'}}
              thumbColor={item.isEnabled ? '#f4f3f4' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleNotifyMeSwitch(item.id)}
              value={item.isEnabled}
              disabled={!isEnabled}
            />
          </View>
        ))}
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
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    placeholder: {
      width: 32,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    text: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    switch: {
      transform: [{scaleX: 1}, {scaleY: 1}],
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    Subtext: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    SubtextTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      paddingRight: 8,
    },
    SubtextSwitch: {
      padding: 4,
    },
    
  });

export default Notifications;
