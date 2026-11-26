import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADII, SPACING } from '../utils/constants';

interface GoalProgressBarProps {
  current: number;
  target: number;
  unit: string;
  color: string;
  trackColor?: string;
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({
  current,
  target,
  unit,
  color,
  trackColor = COLORS.border,
}) => {
  const safeTarget = target > 0 ? target : 1;
  const ratio = Math.max(0, Math.min(1, current / safeTarget));
  const percent = Math.min(100, Math.round(ratio * 100));

  const animatedValue = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: ratio,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedValue, ratio]);

  const widthInterpolated = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolated,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.label}>
        {current.toLocaleString()} / {target.toLocaleString()} {unit} ({percent}
        %)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  track: {
    width: '100%',
    height: 10,
    borderRadius: RADII.full,
    overflow: 'hidden',
  },
  fill: {
    height: 10,
    borderRadius: RADII.full,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
