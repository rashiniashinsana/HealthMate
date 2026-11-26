import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetricCard } from '../components/MetricCard';
import { WeeklyTrendChart } from '../components/WeeklyTrendChart';
import { serializeRecords } from '../database/healthRepository';
import { useHealth } from '../hooks/useHealth';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { UserGoals } from '../types/goals';
import {
  CARD_SHADOW,
  COLORS,
  QUICK_WATER_INCREMENT_ML,
  RADII,
  SPACING,
  VALIDATION_LIMITS,
} from '../utils/constants';
import {
  formatFriendlyDate,
  formatLongDate,
  getTodayISO,
} from '../utils/dateUtils';
import { showAlert, showConfirm } from '../utils/platformAlert';

type DashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavProp>();
  const insets = useSafeAreaInsets();
  const {
    records,
    todaySummary,
    weeklyStats,
    weeklyAnalytics,
    goals,
    isLoading,
    error,
    refreshData,
    quickAddWater,
    updateGoals,
    clearAllData,
    resetToDummyData,
    clearError,
  } = useHealth();

  const [exporting, setExporting] = useState(false);
  const [trendsExpanded, setTrendsExpanded] = useState(true);
  const [goalsModalVisible, setGoalsModalVisible] = useState(false);
  const [goalInputs, setGoalInputs] = useState({
    stepGoal: String(goals.stepGoal),
    calorieGoal: String(goals.calorieGoal),
    waterGoal: String(goals.waterGoal),
  });
  const [goalErrors, setGoalErrors] = useState<
    Partial<Record<keyof UserGoals, string>>
  >({});

  const openGoalsModal = useCallback(() => {
    setGoalInputs({
      stepGoal: String(goals.stepGoal),
      calorieGoal: String(goals.calorieGoal),
      waterGoal: String(goals.waterGoal),
    });
    setGoalErrors({});
    setGoalsModalVisible(true);
  }, [goals]);

  const handleSaveGoals = useCallback(async () => {
    const nextErrors: Partial<Record<keyof UserGoals, string>> = {};

    const validateGoalField = (
      raw: string,
      label: string,
      max: number
    ): number | null => {
      const trimmed = raw.trim();
      if (!trimmed || !/^\d+$/.test(trimmed)) {
        return null;
      }
      const num = Number(trimmed);
      if (!Number.isSafeInteger(num) || num <= 0 || num > max) {
        return null;
      }
      return num;
    };

    const parsedSteps = validateGoalField(
      goalInputs.stepGoal,
      'Step goal',
      VALIDATION_LIMITS.MAX_STEPS
    );
    if (parsedSteps === null) {
      nextErrors.stepGoal = `Enter a whole number (1–${VALIDATION_LIMITS.MAX_STEPS.toLocaleString()}).`;
    }

    const parsedCalories = validateGoalField(
      goalInputs.calorieGoal,
      'Calorie goal',
      VALIDATION_LIMITS.MAX_CALORIES
    );
    if (parsedCalories === null) {
      nextErrors.calorieGoal = `Enter a whole number (1–${VALIDATION_LIMITS.MAX_CALORIES.toLocaleString()}).`;
    }

    const parsedWater = validateGoalField(
      goalInputs.waterGoal,
      'Water goal',
      VALIDATION_LIMITS.MAX_WATER_ML
    );
    if (parsedWater === null) {
      nextErrors.waterGoal = `Enter a whole number (1–${VALIDATION_LIMITS.MAX_WATER_ML.toLocaleString()}).`;
    }

    setGoalErrors(nextErrors);
    if (
      Object.keys(nextErrors).length > 0 ||
      parsedSteps === null ||
      parsedCalories === null ||
      parsedWater === null
    ) {
      return;
    }

    try {
      await updateGoals({
        stepGoal: parsedSteps,
        calorieGoal: parsedCalories,
        waterGoal: parsedWater,
      });
      setGoalsModalVisible(false);
    } catch {
      // Error banner is driven by HealthContext.
    }
  }, [goalInputs, updateGoals]);

  const handleQuickWater = useCallback(async () => {
    try {
      await quickAddWater(QUICK_WATER_INCREMENT_ML);
    } catch {
      // Error banner is driven by HealthContext.
    }
  }, [quickAddWater]);

  const handleExport = useCallback(
    async (format: 'csv' | 'json') => {
      if (records.length === 0) {
        showAlert(
          'Nothing to Export',
          'Add at least one health record before exporting.'
        );
        return;
      }

      try {
        setExporting(true);
        const payload = serializeRecords(records, format);

        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const mimeType =
            format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;';
          const blob = new Blob([payload], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `healthmate-export-${getTodayISO()}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          return;
        }

        await Share.share({
          title: `HealthMate Export (${format.toUpperCase()})`,
          message: payload,
        });
      } catch (err) {
        showAlert(
          'Export Failed',
          err instanceof Error ? err.message : 'Unable to export records.'
        );
      } finally {
        setExporting(false);
      }
    },
    [records]
  );

  const handleResetSampleData = useCallback(() => {
    showConfirm(
      'Reset Sample Data',
      'Replace current records with the default 4 sample health entries?',
      async () => {
        try {
          await resetToDummyData();
        } catch {
          // Error surfaced by HealthContext.
        }
      },
      'Reset'
    );
  }, [resetToDummyData]);

  const handleClearAllData = useCallback(() => {
    showConfirm(
      'Clear All Records',
      'Delete all stored health records? You can restore sample data anytime.',
      async () => {
        try {
          await clearAllData();
        } catch {
          // Error surfaced by HealthContext.
        }
      },
      'Clear All',
      true
    );
  }, [clearAllData]);

  const todayFormatted = formatLongDate(getTodayISO());
  const recentActivity = records.slice(0, 2);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 96 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshData}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBanner}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.greetingLabel}>Daily Wellness Overview</Text>
            <Text style={styles.todayHeading}>Today – {todayFormatted}</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.entryBadge}>
              <Text style={styles.entryBadgeText}>
                {todaySummary.recordCount}{' '}
                {todaySummary.recordCount === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
            <Pressable
              onPress={openGoalsModal}
              style={({ pressed }) => [
                styles.editGoalsBtn,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Edit Daily Goals"
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={18}
                color={COLORS.textOnPrimary}
              />
            </Pressable>
          </View>
        </View>

        {error ? (
          <Pressable onPress={clearError} style={styles.errorBanner}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={18}
              color={COLORS.error}
            />
            <Text style={styles.errorText}>{error}</Text>
          </Pressable>
        ) : null}

        {isLoading && records.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your health data...</Text>
          </View>
        ) : (
          <>
            <View style={styles.cardsStack}>
              <MetricCard
                title="Steps Walked"
                value={todaySummary.totalSteps}
                goal={goals.stepGoal}
                unit="steps"
                iconName="walk"
                accentColor={COLORS.steps}
                accentBg={COLORS.stepsBg}
              />

              <MetricCard
                title="Calories Burned"
                value={todaySummary.totalCalories}
                goal={goals.calorieGoal}
                unit="kcal"
                iconName="fire"
                accentColor={COLORS.calories}
                accentBg={COLORS.caloriesBg}
              />

              <MetricCard
                title="Water Intake"
                value={todaySummary.totalWater}
                goal={goals.waterGoal}
                unit="ml"
                iconName="water-outline"
                accentColor={COLORS.water}
                accentBg={COLORS.waterBg}
                quickActionLabel="+250 ml"
                onQuickAction={handleQuickWater}
              />
            </View>

            {/* 7-Day Weekly Trend Visualization */}
            {weeklyAnalytics ? (
              <View style={styles.sectionCard}>
                <Pressable
                  onPress={() => setTrendsExpanded((prev) => !prev)}
                  style={styles.sectionHeader}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle 7-Day Trend Chart"
                >
                  <View style={styles.sectionTitleRow}>
                    <MaterialCommunityIcons
                      name="chart-bar"
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text style={styles.sectionTitle}>7-Day Trends</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={trendsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </Pressable>

                {trendsExpanded ? (
                  <WeeklyTrendChart analytics={weeklyAnalytics} />
                ) : null}
              </View>
            ) : null}

            {/* Recent Activity (Last 2 Entries) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.sectionTitle}>Recent Activity</Text>
                </View>
                <Pressable onPress={() => navigation.navigate('Records')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </Pressable>
              </View>

              {recentActivity.length === 0 ? (
                <Text style={styles.emptyRecentText}>
                  No entries logged yet. Tap + to add your first record.
                </Text>
              ) : (
                <View style={styles.recentList}>
                  {recentActivity.map((item) => (
                    <View key={item.id} style={styles.recentRow}>
                      <View>
                        <Text style={styles.recentDate}>
                          {formatFriendlyDate(item.date)}
                        </Text>
                        <Text style={styles.recentDateSub}>{item.date}</Text>
                      </View>
                      <View style={styles.recentRightGroup}>
                        <View style={styles.recentMetrics}>
                          <Text
                            style={[styles.recentValue, { color: COLORS.steps }]}
                          >
                            {item.steps.toLocaleString()} steps
                          </Text>
                          <Text style={styles.recentSubMetrics}>
                            {item.calories.toLocaleString()} kcal ·{' '}
                            {item.water.toLocaleString()} ml
                          </Text>
                        </View>
                        <Pressable
                          onPress={() =>
                            navigation.navigate('AddEditRecord', {
                              record: item,
                            })
                          }
                          style={({ pressed }) => [
                            styles.recentEditBtn,
                            pressed && styles.pressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit entry for ${item.date}`}
                        >
                          <MaterialCommunityIcons
                            name="pencil-outline"
                            size={16}
                            color={COLORS.primary}
                          />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 7-Day Rolling Averages */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialCommunityIcons
                    name="chart-line"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.sectionTitle}>7-Day Rolling Averages</Text>
                </View>
                <Text style={styles.sectionMeta}>
                  {weeklyStats.daysLogged}/7 days logged
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: COLORS.steps }]}>
                    {weeklyStats.averageSteps.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Avg Steps/day</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: COLORS.calories }]}>
                    {weeklyStats.averageCalories.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Avg kcal/day</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: COLORS.water }]}>
                    {weeklyStats.averageWater.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Avg ml/day</Text>
                </View>
              </View>
            </View>

            {/* Data Export */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialCommunityIcons
                    name="database-export-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.sectionTitle}>Export Health Data</Text>
                </View>
                <Text style={styles.sectionMeta}>
                  {records.length} total records
                </Text>
              </View>

              <View style={styles.exportRow}>
                <Pressable
                  onPress={() => handleExport('csv')}
                  disabled={exporting}
                  style={({ pressed }) => [
                    styles.exportButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="file-delimited-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.exportButtonText}>Export CSV</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleExport('json')}
                  disabled={exporting}
                  style={({ pressed }) => [
                    styles.exportButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="code-json"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.exportButtonText}>Export JSON</Text>
                </Pressable>
              </View>
            </View>

            {/* Demo & Examiner Data Controls */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialCommunityIcons
                    name="database-refresh-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.sectionTitle}>Data Controls</Text>
                </View>
                <Text style={styles.sectionMeta}>Demo & Reset</Text>
              </View>

              <View style={styles.exportRow}>
                <Pressable
                  onPress={handleResetSampleData}
                  style={({ pressed }) => [
                    styles.exportButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="restore"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.exportButtonText}>Reset Sample</Text>
                </Pressable>

                <Pressable
                  onPress={handleClearAllData}
                  style={({ pressed }) => [
                    styles.clearAllButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="delete-sweep-outline"
                    size={18}
                    color={COLORS.error}
                  />
                  <Text style={styles.clearAllButtonText}>Clear All</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('AddEditRecord')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: SPACING.xl + insets.bottom },
          pressed && styles.fabPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Quick Add Health Record"
      >
        <MaterialCommunityIcons
          name="plus"
          size={28}
          color={COLORS.textOnPrimary}
        />
      </Pressable>

      <Modal
        visible={goalsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Daily Goals</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Steps Target</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  goalErrors.stepGoal ? styles.modalInputError : undefined,
                ]}
                value={goalInputs.stepGoal}
                onChangeText={(text) =>
                  setGoalInputs((prev) => ({ ...prev, stepGoal: text }))
                }
                keyboardType="number-pad"
                maxLength={6}
              />
              {goalErrors.stepGoal ? (
                <Text style={styles.modalErrorText}>{goalErrors.stepGoal}</Text>
              ) : null}
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Calories Target (kcal)</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  goalErrors.calorieGoal ? styles.modalInputError : undefined,
                ]}
                value={goalInputs.calorieGoal}
                onChangeText={(text) =>
                  setGoalInputs((prev) => ({ ...prev, calorieGoal: text }))
                }
                keyboardType="number-pad"
                maxLength={5}
              />
              {goalErrors.calorieGoal ? (
                <Text style={styles.modalErrorText}>
                  {goalErrors.calorieGoal}
                </Text>
              ) : null}
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Water Target (ml)</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  goalErrors.waterGoal ? styles.modalInputError : undefined,
                ]}
                value={goalInputs.waterGoal}
                onChangeText={(text) =>
                  setGoalInputs((prev) => ({ ...prev, waterGoal: text }))
                }
                keyboardType="number-pad"
                maxLength={5}
              />
              {goalErrors.waterGoal ? (
                <Text style={styles.modalErrorText}>
                  {goalErrors.waterGoal}
                </Text>
              ) : null}
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setGoalsModalVisible(false)}
                style={[styles.modalBtn, styles.modalCancelBtn]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveGoals}
                style={[styles.modalBtn, styles.modalSaveBtn]}
              >
                <Text style={styles.modalSaveText}>Save Goals</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  headerBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...CARD_SHADOW,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  greetingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  todayHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
  },
  entryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.full,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editGoalsBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.errorBg,
    padding: SPACING.md,
    borderRadius: RADII.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
  },
  loadingBox: {
    paddingVertical: SPACING.xxl * 2,
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  cardsStack: {
    gap: SPACING.md,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...CARD_SHADOW,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyRecentText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  recentList: {
    gap: SPACING.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceMuted,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.md,
  },
  recentDate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  recentDateSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  recentMetrics: {
    alignItems: 'flex-end',
  },
  recentRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recentEditBtn: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  recentSubMetrics: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.md,
    paddingVertical: SPACING.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  exportRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primaryLight,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  clearAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.errorBg,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },
  pressed: {
    opacity: 0.75,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    width: 58,
    height: 58,
    borderRadius: RADII.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalField: {
    gap: SPACING.xs,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceMuted,
  },
  modalInputError: {
    borderColor: COLORS.error,
  },
  modalErrorText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
});
