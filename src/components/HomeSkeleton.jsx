import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const HomeSkeleton = () => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        startAnimation();
      });
    };
    startAnimation();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const SkeletonBox = ({ width, height, style }) => (
    <View style={[styles.skeletonBox, { width, height, backgroundColor: theme.colors.skeletonBase }, style]}>
      <Animated.View
        style={[
          styles.skeletonShimmer,
          {
            backgroundColor: theme.colors.skeletonHighlight,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <SkeletonBox width={120} height={20} style={styles.welcomeText} />
        <SkeletonBox width={80} height={16} style={styles.userName} />
      </View>

      {/* Balance Cards */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceCard}>
          <SkeletonBox width={60} height={16} style={styles.balanceLabel} />
          <SkeletonBox width={80} height={24} style={styles.balanceAmount} />
        </View>
        <View style={styles.balanceCard}>
          <SkeletonBox width={80} height={16} style={styles.balanceLabel} />
          <SkeletonBox width={70} height={24} style={styles.balanceAmount} />
        </View>
        <View style={styles.balanceCard}>
          <SkeletonBox width={90} height={16} style={styles.balanceLabel} />
          <SkeletonBox width={75} height={24} style={styles.balanceAmount} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <SkeletonBox width={width - 40} height={45} style={styles.searchBar} />
      </View>

      {/* Groups Section */}
      <View style={styles.groupsSection}>
        <SkeletonBox width={100} height={20} style={styles.sectionTitle} />
        
        {/* Group Items */}
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.groupItem}>
            <SkeletonBox width={50} height={50} style={styles.groupAvatar} />
            <View style={styles.groupInfo}>
              <SkeletonBox width={120} height={18} style={styles.groupName} />
              <SkeletonBox width={90} height={14} style={styles.groupMembers} />
            </View>
            <View style={styles.groupBalance}>
              <SkeletonBox width={60} height={16} style={styles.balanceText} />
              <SkeletonBox width={50} height={14} style={styles.balanceSubtext} />
            </View>
          </View>
        ))}
      </View>

      {/* Add Group Button */}
      <View style={styles.addButtonSection}>
        <SkeletonBox width={width - 40} height={50} style={styles.addButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skeletonBox: {
    overflow: 'hidden',
    borderRadius: 8,
    position: 'relative',
  },
  skeletonShimmer: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  headerSection: {
    marginBottom: 20,
  },
  welcomeText: {
    marginBottom: 8,
  },
  userName: {
    marginBottom: 5,
  },
  balanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  balanceLabel: {
    marginBottom: 8,
  },
  balanceAmount: {
    marginBottom: 5,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchBar: {
    borderRadius: 25,
  },
  groupsSection: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
  },
  groupAvatar: {
    borderRadius: 25,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    marginBottom: 4,
  },
  groupMembers: {
    marginBottom: 2,
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  balanceText: {
    marginBottom: 2,
  },
  balanceSubtext: {
    marginBottom: 1,
  },
  addButtonSection: {
    paddingVertical: 20,
  },
  addButton: {
    borderRadius: 25,
  },
});

export default HomeSkeleton;