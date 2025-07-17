// BiometricContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BiometricContext = createContext();

export const useBiometrics = () => {
  const context = useContext(BiometricContext);
  if (!context) {
    throw new Error('useBiometrics must be used within a BiometricProvider');
  }
  return context;
};

export const BiometricProvider = ({ children }) => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const rnBiometrics = new ReactNativeBiometrics();

  // Load user preference from AsyncStorage
  useEffect(() => {
    const checkSupportAndLoad = async () => {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();

      if (available && biometryType) {
        setIsBiometricSupported(true);
        setBiometricType(biometryType);
      }

      const storedLock = await AsyncStorage.getItem('appLockEnabled');
      setAppLockEnabled(storedLock === 'true');
    };

    checkSupportAndLoad();
  }, []);

  const toggleAppLock = async (enabled) => {
    setAppLockEnabled(enabled);
    await AsyncStorage.setItem('appLockEnabled', enabled ? 'true' : 'false');
  };

  const authenticate = async () => {
    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Unlock with biometrics',
      });
      return success;
    } catch (error) {
      return false;
    }
  };

  return (
    <BiometricContext.Provider
      value={{
        isBiometricSupported,
        biometricType,
        appLockEnabled,
        toggleAppLock,
        authenticate,
      }}
    >
      {children}
    </BiometricContext.Provider>
  );
};
