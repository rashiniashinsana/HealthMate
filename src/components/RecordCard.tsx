import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HealthRecord } from '../types/health';
import { CARD_SHADOW, COLORS, RADII, SPACING } from '../utils/constants';
import { formatDisplayDate, formatFriendlyDate } from '../utils/dateUtils';

interface RecordCardProps {
  record: HealthRecord;
  onEdit: (record: HealthRecord) => void;
  onDelete: (record: HealthRecord) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  onEdit,
  onDelete,
}) => {
  const friendlyLabel = formatFriendlyDate(record.date);
  const fullDate = formatDisplayDate(record.date);

  return (
    <View style={styles.card}>
      <View style={styles.accentStrip} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.dateTitle}>{friendlyLabel}</Text>
            <Text style={styles.dateSubtitle}>{fullDate}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => onEdit(record)}
              style={({ pressed }) => [
                styles.iconButton,
                styles.editButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Edit record for ${record.date}`}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color={COLORS.primaryDark}
              />
            </Pressable>

            <Pressable
              onPress={() => onDelete(record)}
              style={({ pressed }) => [
                styles.iconButton,
                styles.deleteButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Delete record for ${record.date}`}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={18}
                color={COLORS.error}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricPill, { backgroundColor: COLORS.stepsBg }]}>
            <MaterialCommunityIcons
              name="walk"
              size={16}
              color={COLORS.steps}
            />
            <View>
              <Text style={[styles.metricValue, { color: COLORS.stepsBadge }]}>
                {record.steps.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>steps</Text>
            </View>
          </View>

          <View
            style={[styles.metricPill, { backgroundColor: COLORS.caloriesBg }]}
          >
            <MaterialCommunityIcons
              name="fire"
              size={16}
              color={COLORS.calories}
            />
            <View>
              <Text
                style={[styles.metricValue, { color: COLORS.caloriesBadge }]}
              >
                {record.calories.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>kcal</Text>
            </View>
          </View>

          <View style={[styles.metricPill, { backgroundColor: COLORS.waterBg }]}>
            <MaterialCommunityIcons
              name="water-outline"
              size={16}
              color={COLORS.water}
            />
            <View>
              <Text style={[styles.metricValue, { color: COLORS.waterBadge }]}>
                {record.water.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>ml</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  accentStrip: {
    width: 4,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: COLORS.primaryLight,
  },
  deleteButton: {
    backgroundColor: COLORS.errorBg,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.75,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  metricPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.md,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
