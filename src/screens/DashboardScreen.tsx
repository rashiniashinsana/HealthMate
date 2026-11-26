import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MetricCard } from '../components/MetricCard';
import { useHealth } from '../context/HealthContext';
import { serializeRecords } from '../database/healthRepository';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import {
  CARD_SHADOW,
  COLORS,
  DAILY_GOALS,
  QUICK_WATER_INCREMENT_ML,
  RADII,
  SPACING,
} from '../utils/constants';
import { formatDisplayDate, getTodayISO } from '../utils/dateUtils';

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
    loading,
    error,
    refreshRecords,
    quickLogWater,
    clearError,
  } = useHealth();

  const [exporting, setExporting] = useState(false);

  const handleQuickWater = useCallback(async () => {
    try {
      await quickLogWater(QUICK_WATER_INCREMENT_ML);
    } catch {
      // Error state is handled by HealthContext
    }
  }, [quickLogWater]);

  const handleExport = useCallback(
    async (format: 'csv' | 'json') => {
      if (records.length === 0) {
        Alert.alert(
          'Nothing to Export',
          'Add at least one health record before exporting.'
        );
        return;
      }

      try {
        setExporting(true);
        const payload = serializeRecords(records, format);
        await Share.share({
          title: `HealthMate Export (${format.toUpperCase()})`,
          message: payload,
        });
      } catch (err) {
        Alert.alert(
          'Export Failed',
          err instanceof Error ? err.message : 'Unable to export records.'
        );
      } finally {
        setExporting(false);
      }
    },
    [records]
  );

  const todayFormatted = formatDisplayDate(getTodayISO());

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshRecords}
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

        {loading && records.length === 0 ? (
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

            {/* 7-Day Rolling Averages Card */}
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

            {/* Data Export Card */}
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
          </>
        )}
      </ScrollView>

      {/* Quick Add Floating Action Button */}
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
    paddingBottom: 96,
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
  pressed: {
    opacity: 0.75,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
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
