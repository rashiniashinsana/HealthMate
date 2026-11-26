import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { RecordCard } from '../components/RecordCard';
import { Theme } from '../constants/theme';
import { useHealth } from '../hooks/useHealth';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { HealthRecord } from '../types/health';
import { CARD_SHADOW, COLORS, RADII, SPACING } from '../utils/constants';
import {
  formatDisplayDate,
  getOffsetDateISO,
  getTodayISO,
  isValidISODate,
} from '../utils/dateUtils';
import { exportHealthRecordsToCsv } from '../utils/exportCsv';
import { showConfirm } from '../utils/platformAlert';

type RecordListNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Records'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const RecordListScreen: React.FC = () => {
  const navigation = useNavigation<RecordListNavProp>();
  const {
    records,
    isLoading,
    dateFilter,
    refreshData,
    setDateFilter,
    deleteEntry,
  } = useHealth();

  const [dateQuery, setDateQuery] = useState<string>(dateFilter ?? '');
  const [filterError, setFilterError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const handleExportCsv = useCallback(async () => {
    try {
      setExporting(true);
      await exportHealthRecordsToCsv();
    } finally {
      setExporting(false);
    }
  }, []);

  const handleApplyFilter = useCallback(async () => {
    const trimmed = dateQuery.trim();
    if (!trimmed) {
      setFilterError(null);
      await setDateFilter(null);
      return;
    }

    if (!isValidISODate(trimmed)) {
      setFilterError('Use YYYY-MM-DD format (e.g. 2026-11-26).');
      return;
    }

    setFilterError(null);
    await setDateFilter(trimmed);
  }, [dateQuery, setDateFilter]);

  const handleClearFilter = useCallback(async () => {
    setDateQuery('');
    setFilterError(null);
    await setDateFilter(null);
  }, [setDateFilter]);

  const handleQuickDate = useCallback(
    async (isoDate: string | null) => {
      setDateQuery(isoDate ?? '');
      setFilterError(null);
      await setDateFilter(isoDate);
    },
    [setDateFilter]
  );

  const handleEdit = useCallback(
    (record: HealthRecord) => {
      navigation.navigate('AddEditRecord', { record });
    },
    [navigation]
  );

  const handleDeletePrompt = useCallback(
    (record: HealthRecord) => {
      showConfirm(
        'Delete Health Record',
        `Are you sure you want to delete this record?\n(${formatDisplayDate(
          record.date
        )} · ${record.steps.toLocaleString()} steps)`,
        async () => {
          try {
            await deleteEntry(record.id);
          } catch {
            // Error surfaced by HealthContext.
          }
        },
        'Delete',
        true
      );
    },
    [deleteEntry]
  );

  const todayISO = getTodayISO();
  const yesterdayISO = getOffsetDateISO(-1);

  return (
    <View style={styles.screen}>
      <View style={styles.filterContainer}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.inputWrapper,
              filterError ? styles.inputError : undefined,
            ]}
          >
            <MaterialCommunityIcons
              name={Theme.icons.search}
              size={20}
              color={COLORS.primary}
            />
            <TextInput
              style={styles.input}
              value={dateQuery}
              onChangeText={(text) => {
                setDateQuery(text);
                if (filterError) {
                  setFilterError(null);
                }
              }}
              placeholder="Filter by YYYY-MM-DD"
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="search"
              onSubmitEditing={handleApplyFilter}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={10}
            />
            {dateQuery.length > 0 ? (
              <Pressable onPress={handleClearFilter} hitSlop={8}>
                <MaterialCommunityIcons
                  name={Theme.icons.clear}
                  size={18}
                  color={COLORS.textMuted}
                />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={handleApplyFilter}
            style={({ pressed }) => [
              styles.applyButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.applyButtonText}>Filter</Text>
          </Pressable>
        </View>

        {filterError ? (
          <Text style={styles.filterErrorText}>{filterError}</Text>
        ) : null}

        <View style={styles.chipRow}>
          <Pressable
            onPress={() => handleQuickDate(null)}
            style={[styles.chip, dateFilter === null && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                dateFilter === null && styles.chipTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleQuickDate(todayISO)}
            style={[styles.chip, dateFilter === todayISO && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                dateFilter === todayISO && styles.chipTextActive,
              ]}
            >
              Today
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleQuickDate(yesterdayISO)}
            style={[
              styles.chip,
              dateFilter === yesterdayISO && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                dateFilter === yesterdayISO && styles.chipTextActive,
              ]}
            >
              Yesterday
            </Text>
          </Pressable>

          <Pressable
            onPress={handleExportCsv}
            disabled={exporting}
            style={({ pressed }) => [
              styles.exportPill,
              exporting && styles.exportPillDisabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Export health records to CSV"
          >
            {exporting ? (
              <ActivityIndicator size="small" color={COLORS.primaryDark} />
            ) : (
              <MaterialCommunityIcons
                name={Theme.icons.export}
                size={15}
                color={COLORS.primaryDark}
              />
            )}
            <Text style={styles.exportPillText}>
              {exporting ? 'Exporting…' : 'Export Data'}
            </Text>
          </Pressable>
        </View>
      </View>

      {dateFilter ? (
        <View style={styles.activeFilterBanner}>
          <Text style={styles.activeFilterText}>
            Showing: {dateFilter}
          </Text>
          <Pressable onPress={handleClearFilter} hitSlop={8}>
            <Text style={styles.resetFilterLink}>Reset</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshData}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        renderItem={({ item }) => (
          <RecordCard
            record={item}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? undefined : (
            <EmptyState
              title="No entries found"
              description={
                dateFilter
                  ? `No health records match ${formatDisplayDate(dateFilter)}.`
                  : 'Start tracking your daily steps, calories, and water intake.'
              }
              actionLabel={dateFilter ? 'Reset Filter' : 'Log Your First Entry'}
              onAction={
                dateFilter
                  ? handleClearFilter
                  : () => navigation.navigate('AddEditRecord')
              }
            />
          )
        }
      />

      <Pressable
        onPress={() => navigation.navigate('AddEditRecord')}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="Add Health Record"
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
  filterContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 4,
    paddingBottom: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  applyButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  filterErrorText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.surfaceMuted,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  exportPill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.primaryLight,
  },
  exportPillDisabled: {
    opacity: 0.65,
  },
  exportPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  activeFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  resetFilterLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 96,
  },
  separator: {
    height: SPACING.sm + 4,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.8,
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
    ...CARD_SHADOW,
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});
