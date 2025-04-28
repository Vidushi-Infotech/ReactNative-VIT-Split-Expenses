import React from 'react';
import { TouchableOpacity, Text, View, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext.jsx';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import styles from './GroupDetailsStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TabBar = ({ tabs, activeTab, tabIndicatorPosition, handleTabChange }) => {
  const { colors: themeColors } = useTheme();

  // Animated styles for tab indicator
  const tabIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabIndicatorPosition.value }],
    };
  });

  return (
    <View style={[
      styles.tabBarContainer,
      {
        shadowColor: themeColors.dark.default,
        borderBottomColor: themeColors.border
      }
    ]}>
      <View style={[
        styles.tabBar,
        {
          backgroundColor: themeColors.surface,
          borderBottomColor: themeColors.border
        }
      ]}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => handleTabChange(tab.key, index)}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon}
                size={22}
                color={isActive ? themeColors.primary.default : themeColors.textSecondary}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? themeColors.primary.default : themeColors.textSecondary,
                    fontWeight: isActive ? '700' : '500'
                  }
                ]}
              >
                {tab.title}
              </Text>

              {/* Active tab highlight (subtle background) */}
              {isActive && (
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    right: 8,
                    bottom: 8,
                    backgroundColor: themeColors.primary.default + '10', // 10% opacity
                    borderRadius: 8,
                    zIndex: -1
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Animated Tab Indicator */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              backgroundColor: themeColors.primary.default,
              width: SCREEN_WIDTH / 3,
              height: 3
            },
            tabIndicatorStyle
          ]}
        />
      </View>
    </View>
  );
};

export default TabBar;
