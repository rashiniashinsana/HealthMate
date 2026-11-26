import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { COLORS, RADII } from '../utils/constants';

interface ProgressBarProps {
  progress: number;
  color: string;
  trackColor?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  trackColor = COLORS.border,
  height = 8,
}) => {
  const clamped = Math.max(0, Math.min(1, progress));
  const animatedValue = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: clamped,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedValue, clamped]);

  const widthInterpolated = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolated,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: RADII.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: RADII.full,
  },
});
