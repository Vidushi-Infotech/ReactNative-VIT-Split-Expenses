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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';
import Fingerprint from './Fingerprint';
import FaceID from './FaceID';

const AccountPrivacy = ({onClose}) => {
  const {theme} = useTheme();
  const styles = createStyles(theme);
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [showFaceID, setShowFaceID] = useState(false);

  const ApplockOptions = [
    {
      id: 1,
      title: 'Fingerprint',
      iconComponent: <Ionicons name="finger-print" size={20} color={theme.colors.icon} />,
      onPress: () => setShowFingerprint(true),
    },
    {
      id: 2,
      title: 'Face ID',
      iconComponent: <Ionicons name="eye" size={20} color={theme.colors.icon} />,
      onPress: () => setShowFaceID(true),
    },
  ];

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
        <Text style={styles.headerTitle}>Account Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style = {styles.text}>App Lock</Text>
        {ApplockOptions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.option}
            onPress={item.onPress}
            activeOpacity={0.7}
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
              color={theme.colors.icon}
            />
          </TouchableOpacity>
        ))}

        {/*Fingerprint Modal */}
        <Modal
          visible={showFingerprint}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <Fingerprint onClose={() => setShowFingerprint(false)} />
        </Modal>

        {/*Face ID Modal */}
        <Modal
          visible={showFaceID}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <FaceID onClose={() => setShowFaceID(false)} />
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

export default  AccountPrivacy;
