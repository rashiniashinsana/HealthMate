import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetricCard } from '../components/MetricCard';
import { serializeRecords } from '../database/healthRepository';
import { useHealth } from '../hooks/useHealth';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import {
  CARD_SHADOW,
  COLORS,
  DAILY_GOALS,
  QUICK_WATER_INCREMENT_ML,
  RADII,
  SPACING,
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
    isLoading,
    error,
    refreshData,
    quickAddWater,
    clearAllData,
    resetToDummyData,
    clearError,
  } = useHealth();

  const [exporting, setExporting] = useState(false);

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
          <View style={styles.entryBadge}>
            <Text style={styles.entryBadgeText}>
              {todaySummary.recordCount}{' '}
              {todaySummary.recordCount === 1 ? 'entry' : 'entries'}
            </Text>
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
                goal={DAILY_GOALS.STEPS}
                unit="steps"
                iconName="walk"
                accentColor={COLORS.steps}
                accentBg={COLORS.stepsBg}
              />

              <MetricCard
                title="Calories Burned"
                value={todaySummary.totalCalories}
                goal={DAILY_GOALS.CALORIES}
                unit="kcal"
                iconName="fire"
                accentColor={COLORS.calories}
                accentBg={COLORS.caloriesBg}
              />

              <MetricCard
                title="Water Intake"
                value={todaySummary.totalWater}
                goal={DAILY_GOALS.WATER_ML}
                unit="ml"
                iconName="water-outline"
                accentColor={COLORS.water}
                accentBg={COLORS.waterBg}
                quickActionLabel="+250 ml"
                onQuickAction={handleQuickWater}
              />
            </View>

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
});
