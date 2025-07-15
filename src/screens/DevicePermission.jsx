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
import Camera from './Camera';
import Photos from './Photos';
import LocationServices from './LocationServices';
import NotificationPermission from './NotificationPermission';

const DevicePermission = ({onClose}) => {
  const {theme} = useTheme();
  const styles = createStyles(theme);
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showLocationServices, setShowLocationServices] = useState(false);
  const [showNotificationPermission, setShowNotificationPermission] = useState(false);

  const Menu = [
    {
      id: 1,
      title: 'Camera',
      iconComponent: <Ionicons name="camera" size={20} color={theme.colors.icon} />,
      onPress: () => setShowCamera(true),
    },
    {
      id: 2,
      title: 'Photos',
      iconComponent: <Ionicons name="images" size={20} color={theme.colors.icon} />,
      onPress: () => setShowPhotos(true),
      disabled: false,
    },
    {
      id: 3,
      title: 'Location Services',
      iconComponent: <Ionicons name="location" size={20} color={theme.colors.icon} />,
      onPress: () => setShowLocationServices(true),
      disabled: false,
    },
    {
      id: 4,
      title: 'Notification Permission',
      iconComponent: <Ionicons name="notifications" size={20} color={theme.colors.icon} />,
      onPress: () => setShowNotificationPermission(true),
      disabled: false,
    },
  ]

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
        <Text style = {styles.text}>Your Preferences</Text>
        {Menu.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.option}
            onPress={item.onPress}
            activeOpacity={0.7}
            disabled={item.disabled}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                {item.iconComponent}
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>
                  {item.title}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={item.disabled ? "#E5E7EB" : "#CBD5E0"}
            />
          </TouchableOpacity>
        ))}

        {/*Camera Modal */}
        <Modal
          visible={showCamera}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <Camera onClose={() => setShowCamera(false)} />
        </Modal>
        
        {/*Photos Modal */}
        <Modal
          visible={showPhotos}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <Photos onClose={() => setShowPhotos(false)} />
        </Modal>

        {/*Location Services Modal */}
        <Modal
          visible={showLocationServices}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <LocationServices onClose={() => setShowLocationServices(false)} />
        </Modal>

        {/*Notification Permission Modal */}
        <Modal
          visible={showNotificationPermission}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <NotificationPermission onClose={() => setShowNotificationPermission(false)} />
        </Modal>

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
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        margin: 20,
        position: 'relative',
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
    optionSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
  });

export default  DevicePermission;
