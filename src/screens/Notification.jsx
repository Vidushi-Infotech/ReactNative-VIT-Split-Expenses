
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';

const Notifications = ({onClose}) => {
  const {theme} = useTheme();
  const styles = createStyles(theme);
  const [isEnabled, setIsEnabled] = useState(false);

  const notifymeOptions = [
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
  ];

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  const toggleNotifyMeSwitch = (item) => {
    item.isEnabled(!item.isEnabled);
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

      <ScrollView style={styles.scrollView}>
        <Text style = {styles.text}>Enable Notifications         
        <Switch style = {styles.switch}
          trackColor={{ false: "#767577", true: theme.colors.primary }}
          thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
        </Text>
        <Text style = {styles.text}>Notify Me</Text>
        {notifymeOptions.map((item) => (
          <Text key={item.id} style={styles.Subtext}>
            <Text style={styles.SubtextTitle}>{item.title}</Text>
            <Switch
              style={styles.SubtextSwitch}
              trackColor={{ false: "#767577", true: theme.colors.primary }}
              thumbColor={item.isEnabled ? "#f5dd4b" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleNotifyMeSwitch(item)}
              value={item.isEnabled}
            />
          </Text>
        ))}        
      </ScrollView>
    </SafeAreaView>
  );
};


const createStyles = (theme) => StyleSheet.create({
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
    switch: {
      flex : 1,
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
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
    },
    SubtextTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    SubtextSwitch: {
      padding : 4,
    },
  });

export default  Notifications;
