import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CARD_SHADOW, COLORS, RADII, SPACING } from '../utils/constants';
import { GoalProgressBar } from './GoalProgressBar';

export interface MetricCardProps {
  title: string;
  value: number;
  goal: number;
  unit: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  accentColor: string;
  accentBg: string;
  quickActionLabel?: string;
  onQuickAction?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  goal,
  unit,
  iconName,
  accentColor,
  accentBg,
  quickActionLabel,
  onQuickAction,
}) => {
  const ratio = goal > 0 ? value / goal : 0;
  const percent = Math.min(999, Math.round(ratio * 100));
  const goalMet = value >= goal;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconBadge, { backgroundColor: accentBg }]}>
            <MaterialCommunityIcons
              name={iconName}
              size={22}
              color={accentColor}
            />
          </View>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.goalText}>
              Target: {goal.toLocaleString()} {unit}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.percentBadge,
            { backgroundColor: goalMet ? COLORS.successBg : accentBg },
          ]}
        >
          <Text
            style={[
              styles.percentText,
              { color: goalMet ? COLORS.success : accentColor },
            ]}
          >
            {goalMet ? 'Goal Met' : `${percent}%`}
          </Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueText}>
          {value.toLocaleString()}
          <Text style={styles.unitText}> {unit}</Text>
        </Text>

        {quickActionLabel && onQuickAction ? (
          <Pressable
            onPress={onQuickAction}
            style={({ pressed }) => [
              styles.quickButton,
              { backgroundColor: accentBg },
              pressed && styles.quickButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={quickActionLabel}
          >
            <MaterialCommunityIcons name="plus" size={16} color={accentColor} />
            <Text style={[styles.quickButtonText, { color: accentColor }]}>
              {quickActionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <GoalProgressBar
        current={value}
        target={goal}
        unit={unit}
        color={accentColor}
        trackColor={accentBg}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...CARD_SHADOW,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  goalText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  percentBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.full,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  valueText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
  },
  quickButtonPressed: {
    opacity: 0.75,
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
