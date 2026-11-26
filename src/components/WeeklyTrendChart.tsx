import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { WeeklyAnalyticsSummary } from '../types/health';
import { COLORS, RADII, SPACING } from '../utils/constants';

type MetricKey = 'steps' | 'calories' | 'water';

interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  tint: string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'steps',
    label: 'Steps',
    unit: 'steps',
    color: COLORS.steps,
    tint: COLORS.stepsBg,
  },
  {
    key: 'calories',
    label: 'Calories',
    unit: 'kcal',
    color: COLORS.calories,
    tint: COLORS.caloriesBg,
  },
  {
    key: 'water',
    label: 'Water',
    unit: 'ml',
    color: COLORS.water,
    tint: COLORS.waterBg,
  },
];

const MAX_BAR_HEIGHT = 112;

function formatCompactValue(value: number): string {
  if (value >= 1000) {
    const scaled = value / 1000;
    return `${scaled >= 10 ? Math.round(scaled) : scaled.toFixed(1)}k`;
  }
  return String(value);
}

interface AnimatedBarProps {
  value: number;
  maxValue: number;
  color: string;
  label: string;
}

const AnimatedBar: React.FC<AnimatedBarProps> = ({
  value,
  maxValue,
  color,
  label,
}) => {
  const targetHeight =
    maxValue > 0 && value > 0
      ? Math.max(8, Math.round((value / maxValue) * MAX_BAR_HEIGHT))
      : 4;

  const heightAnim = useRef(new Animated.Value(targetHeight)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: targetHeight,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [heightAnim, targetHeight]);

  return (
    <View style={styles.barColumn}>
      <Text style={styles.barValue} numberOfLines={1}>
        {value > 0 ? formatCompactValue(value) : '0'}
      </Text>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              height: heightAnim,
              backgroundColor: value > 0 ? color : COLORS.border,
            },
          ]}
        />
      </View>
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
};

interface WeeklyTrendChartProps {
  analytics: WeeklyAnalyticsSummary;
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({
  analytics,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('steps');

  const activeConfig = useMemo(
    () => METRICS.find((m) => m.key === selectedMetric) ?? METRICS[0],
    [selectedMetric]
  );

  const values = useMemo(
    () => analytics.days.map((day) => day[selectedMetric]),
    [analytics.days, selectedMetric]
  );

  const maxValue = useMemo(() => Math.max(...values, 0), [values]);

  const averageValue = useMemo(() => {
    if (selectedMetric === 'steps') return analytics.avgSteps;
    if (selectedMetric === 'calories') return analytics.avgCalories;
    return analytics.avgWater;
  }, [analytics, selectedMetric]);

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        {METRICS.map((metric) => {
          const isSelected = metric.key === selectedMetric;
          return (
            <Pressable
              key={metric.key}
              onPress={() => setSelectedMetric(metric.key)}
              style={[
                styles.segmentButton,
                isSelected && {
                  backgroundColor: metric.tint,
                  borderColor: metric.color,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.segmentText,
                  isSelected && { color: metric.color, fontWeight: '700' },
                ]}
              >
                {metric.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.chartArea}>
        {analytics.days.map((day) => (
          <AnimatedBar
            key={day.date}
            value={day[selectedMetric]}
            maxValue={maxValue}
            color={activeConfig.color}
            label={day.label}
          />
        ))}
      </View>

      <View
        style={[
          styles.averagePill,
          { backgroundColor: activeConfig.tint },
        ]}
      >
        <Text style={[styles.averageText, { color: activeConfig.color }]}>
          7-Day Daily Average: {averageValue.toLocaleString()}{' '}
          {activeConfig.unit}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  barTrack: {
    height: MAX_BAR_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '62%',
    maxWidth: 26,
    borderRadius: RADII.sm,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  averagePill: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.full,
    alignItems: 'center',
  },
  averageText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
