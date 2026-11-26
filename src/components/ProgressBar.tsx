import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS, RADII } from '../utils/constants';

interface ProgressBarProps {
  /** Normalized progress from 0 to 1 (values > 1 are clamped visually). */
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
  const widthPercent = `${Math.round(clamped * 100)}%` as `${number}%`;

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height }]}>
      <View
        style={[
          styles.fill,
          {
            width: widthPercent,
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
