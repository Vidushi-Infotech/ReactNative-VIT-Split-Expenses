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

const DevicePermission = ({onClose}) => {
  const {theme} = useTheme();
  const styles = createStyles(theme);

  const [permissions, setPermissions] = useState([
    {
      id: 1,
      title: 'Camera',
      icon: 'camera',
      enabled: false,
    },
    {
      id: 2,
      title: 'Photos',
      icon: 'images',
      enabled: false,
    },
    {
      id: 3,
      title: 'Location Services',
      icon: 'location',
      enabled: false,
    },
    {
      id: 4,
      title: 'Notification Permission',
      icon: 'notifications',
      enabled: false,
    },
  ]);

  const toggleSwitch = id => {
    setPermissions(prev =>
      prev.map(item =>
        item.id === id ? {...item, enabled: !item.enabled} : item,
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
        <Text style={styles.headerTitle}>Device Permission</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}>Your Preferences</Text>
        {permissions.map(item => (
          <View key={item.id} style={styles.option}>
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={theme.colors.icon}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{item.title}</Text>
              </View>
            </View>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleSwitch(item.id)}
              trackColor={{false: '#767577', true: '#1387c6cb'}}
              thumbColor={item.enabled ? '#f4f3f3ff' : '#f4f3f3ff'}
              ios_backgroundColor="#3e3e3e"
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
    text: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      margin: 20,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
  });

export default DevicePermission;
