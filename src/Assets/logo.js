// Logo component using SVG or Text for Splitzy app
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Logo = ({ size = 120, color = '#6C63FF' }) => {
  return (
    <View style={[styles.container, { width: size + 40, height: size + 40 }]}>
      <View style={[styles.logoCircle, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
        <View style={styles.innerCircle}>
          <Text style={[styles.logoText, { fontSize: size * 0.35, color: '#FFFFFF' }]}>
            S
          </Text>
        </View>
        <View style={[styles.splitLine, { backgroundColor: '#FFFFFF', width: size * 0.6, height: 3 }]} />
      </View>
      <Text style={[styles.brandText, { fontSize: size * 0.16, color: color }]}>
        SPLITZY
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  splitLine: {
    position: 'absolute',
    bottom: '30%',
    borderRadius: 2,
    opacity: 0.9,
  },
  logoText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  brandText: {
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default Logo;
