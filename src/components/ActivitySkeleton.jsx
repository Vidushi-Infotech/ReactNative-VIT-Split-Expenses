import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const ActivitySkeleton = () => {
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <SkeletonBox width={180} height={24} style={styles.headerTitle} />
      </View>

      <View style={styles.content}>
        
        {/* Activity Items */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <View key={item} style={styles.activityCard}>
            <View style={styles.activityHeader}>
              {/* Activity Icon */}
              <SkeletonBox width={40} height={40} style={styles.activityIcon} />
              
              {/* Activity Content */}
              <View style={styles.activityContent}>
                <SkeletonBox width={200} height={16} style={styles.activityTitle} />
                <SkeletonBox width={120} height={14} style={styles.activityGroup} />
                <SkeletonBox width={80} height={12} style={styles.activityTime} />
              </View>
              
              {/* Activity Amount */}
              <SkeletonBox width={60} height={16} style={styles.activityAmount} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    borderRadius: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  activityCard: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    borderRadius: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    marginBottom: 8,
    borderRadius: 4,
  },
  activityGroup: {
    marginBottom: 6,
    borderRadius: 4,
  },
  activityTime: {
    borderRadius: 4,
  },
  activityAmount: {
    borderRadius: 4,
  },
});

export default ActivitySkeleton;