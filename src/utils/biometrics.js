import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export const isBiometricAuthEnabled = async () => {
  const enabled = await AsyncStorage.getItem('fingerprintEnabled');
  return enabled === 'true';
};

export const promptBiometric = async () => {
  const { available } = await rnBiometrics.isSensorAvailable();
  if (!available) return false;

  try {
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage: 'Authenticate to proceed',
    });
    return success;
  } catch (e) {
    return false;
  }
};
