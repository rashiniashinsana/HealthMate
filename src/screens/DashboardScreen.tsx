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
import { BmiCalculatorModal } from '../components/BmiCalculatorModal';
import { MetricCard } from '../components/MetricCard';
import { WeeklyTrendChart } from '../components/WeeklyTrendChart';
import { Theme } from '../constants/theme';
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
  const [bmiModalVisible, setBmiModalVisible] = useState(false);
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

    const validateGoalField = (raw: string, max: number): number | null => {
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
      VALIDATION_LIMITS.MAX_STEPS
    );
    if (parsedSteps === null) {
      nextErrors.stepGoal = `Enter a whole number (1–${VALIDATION_LIMITS.MAX_STEPS.toLocaleString()}).`;
    }

    const parsedCalories = validateGoalField(
      goalInputs.calorieGoal,
      VALIDATION_LIMITS.MAX_CALORIES
    );
    if (parsedCalories === null) {
      nextErrors.calorieGoal = `Enter a whole number (1–${VALIDATION_LIMITS.MAX_CALORIES.toLocaleString()}).`;
    }

    const parsedWater = validateGoalField(
      goalInputs.waterGoal,
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
        contentContainerStyle={styles.scrollContent}
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
        {/* Hero Header */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextGroup}>
            <Text style={styles.greetingText}>Hello, Tracker 👋</Text>
            <Text style={styles.todayHeading}>Today – {todayFormatted}</Text>
            <Text style={styles.entrySubtext}>
              {todaySummary.recordCount}{' '}
              {todaySummary.recordCount === 1 ? 'log' : 'logs'} recorded today
            </Text>
          </View>

          <View style={styles.heroActions}>
            <Pressable
              onPress={() => setBmiModalVisible(true)}
              style={({ pressed }) => [
                styles.circleActionBtn,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open BMI and Baseline Calculator"
            >
              <MaterialCommunityIcons
                name={Theme.icons.calculator}
                size={20}
                color={COLORS.primary}
              />
            </Pressable>

            <Pressable
              onPress={openGoalsModal}
              style={({ pressed }) => [
                styles.circleActionBtn,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Edit Daily Goals"
            >
              <MaterialCommunityIcons
                name={Theme.icons.settings}
                size={20}
                color={COLORS.textSecondary}
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
            {/* Today's Metric Cards */}
            <View style={styles.cardsStack}>
              <MetricCard
                title="Steps Walked"
                value={todaySummary.totalSteps}
                goal={goals.stepGoal}
                unit="steps"
                iconName={Theme.icons.steps}
                accentColor={COLORS.steps}
                accentBg={COLORS.stepsBg}
                badgeTextColor={COLORS.stepsBadge}
              />

              <MetricCard
                title="Calories Burned"
                value={todaySummary.totalCalories}
                goal={goals.calorieGoal}
                unit="kcal"
                iconName={Theme.icons.calories}
                accentColor={COLORS.calories}
                accentBg={COLORS.caloriesBg}
                badgeTextColor={COLORS.caloriesBadge}
              />

              <MetricCard
                title="Water Intake"
                value={todaySummary.totalWater}
                goal={goals.waterGoal}
                unit="ml"
                iconName={Theme.icons.water}
                accentColor={COLORS.water}
                accentBg={COLORS.waterBg}
                badgeTextColor={COLORS.waterBadge}
                quickActionLabel="+250 ml"
                quickActionIcon={Theme.icons.waterPlus}
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
                  <>
                    <View style={styles.sectionDivider} />
                    <WeeklyTrendChart analytics={weeklyAnalytics} />
                  </>
                ) : null}
              </View>
            ) : null}

            {/* Recent Activity */}
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

              <View style={styles.sectionDivider} />

              {recentActivity.length === 0 ? (
                <Text style={styles.emptyRecentText}>
                  No entries logged yet. Tap + to add your first record.
                </Text>
              ) : (
                <View style={styles.recentList}>
                  {recentActivity.map((item) => (
                    <View key={item.id} style={styles.recentRow}>
                      <View style={styles.recentLeft}>
                        <Text style={styles.recentDate}>
                          {formatFriendlyDate(item.date)}
                        </Text>
                        <View style={styles.recentBadgesRow}>
                          <View
                            style={[
                              styles.miniBadge,
                              { backgroundColor: COLORS.stepsBg },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="walk"
                              size={12}
                              color={COLORS.stepsBadge}
                            />
                            <Text
                              style={[
                                styles.miniBadgeText,
                                { color: COLORS.stepsBadge },
                              ]}
                            >
                              {item.steps.toLocaleString()}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.miniBadge,
                              { backgroundColor: COLORS.caloriesBg },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="fire"
                              size={12}
                              color={COLORS.caloriesBadge}
                            />
                            <Text
                              style={[
                                styles.miniBadgeText,
                                { color: COLORS.caloriesBadge },
                              ]}
                            >
                              {item.calories.toLocaleString()}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.miniBadge,
                              { backgroundColor: COLORS.waterBg },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="water-outline"
                              size={12}
                              color={COLORS.waterBadge}
                            />
                            <Text
                              style={[
                                styles.miniBadgeText,
                                { color: COLORS.waterBadge },
                              ]}
                            >
                              {item.water.toLocaleString()} ml
                            </Text>
                          </View>
                        </View>
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
                          color={COLORS.primaryDark}
                        />
                      </Pressable>
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
                  {weeklyStats.daysLogged}/7 days
                </Text>
              </View>

              <View style={styles.sectionDivider} />

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: COLORS.stepsBadge }]}>
                    {weeklyStats.averageSteps.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Avg Steps/day</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                  <Text
                    style={[styles.statValue, { color: COLORS.caloriesBadge }]}
                  >
                    {weeklyStats.averageCalories.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Avg kcal/day</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: COLORS.waterBadge }]}>
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
                  {records.length} records
                </Text>
              </View>

              <View style={styles.sectionDivider} />

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
                    color={COLORS.primaryDark}
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
                    color={COLORS.primaryDark}
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

              <View style={styles.sectionDivider} />

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
                    color={COLORS.primaryDark}
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
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="Quick Add Health Record"
      >
        <MaterialCommunityIcons
          name="plus"
          size={28}
          color={COLORS.textOnPrimary}
        />
      </Pressable>

      <BmiCalculatorModal
        visible={bmiModalVisible}
        onClose={() => setBmiModalVisible(false)}
      />

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
    padding: SPACING.md,
    paddingBottom: 96,
    gap: SPACING.md,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...CARD_SHADOW,
  },
  heroTextGroup: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  todayHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  entrySubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  circleActionBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: COLORS.textSecondary,
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
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm + 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyRecentText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  recentList: {
    gap: SPACING.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentLeft: {
    flex: 1,
    gap: 6,
  },
  recentDate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  recentBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.xl,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recentEditBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  exportRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 12,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primaryLight,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  clearAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 12,
    borderRadius: RADII.md,
    backgroundColor: COLORS.errorBg,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.78,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 58,
    height: 58,
    borderRadius: RADII.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
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
    backgroundColor: COLORS.background,
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
    gap: SPACING.sm + 4,
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
