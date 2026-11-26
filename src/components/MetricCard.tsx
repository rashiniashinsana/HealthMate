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
  badgeTextColor?: string;
  quickActionLabel?: string;
  quickActionIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
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
  badgeTextColor,
  quickActionLabel,
  quickActionIcon = 'plus',
  onQuickAction,
}) => {
  const ratio = goal > 0 ? value / goal : 0;
  const percent = Math.min(999, Math.round(ratio * 100));
  const goalMet = value >= goal;
  const resolvedBadgeText = badgeTextColor ?? accentColor;

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
              { color: goalMet ? COLORS.stepsBadge : resolvedBadgeText },
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
            <MaterialCommunityIcons
              name={quickActionIcon}
              size={16}
              color={resolvedBadgeText}
            />
            <Text
              style={[styles.quickButtonText, { color: resolvedBadgeText }]}
            >
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
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  percentBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.xl,
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
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.xl,
  },
  quickButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.8,
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
