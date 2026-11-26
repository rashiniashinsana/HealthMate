import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { RecordCard } from '../components/RecordCard';
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
import { showConfirm } from '../utils/platformAlert';

type RecordListNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Records'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const RecordListScreen: React.FC = () => {
  const navigation = useNavigation<RecordListNavProp>();
  const insets = useSafeAreaInsets();
  const {
    records,
    isLoading,
    selectedDateFilter,
    refreshData,
    filterByDate,
    removeRecord,
  } = useHealth();

  const [dateQuery, setDateQuery] = useState<string>(selectedDateFilter ?? '');
  const [filterError, setFilterError] = useState<string | null>(null);

  const handleApplyFilter = useCallback(async () => {
    const trimmed = dateQuery.trim();
    if (!trimmed) {
      setFilterError(null);
      await filterByDate(null);
      return;
    }

    if (!isValidISODate(trimmed)) {
      setFilterError('Use YYYY-MM-DD format (e.g. 2026-11-26).');
      return;
    }

    setFilterError(null);
    await filterByDate(trimmed);
  }, [dateQuery, filterByDate]);

  const handleClearFilter = useCallback(async () => {
    setDateQuery('');
    setFilterError(null);
    await filterByDate(null);
  }, [filterByDate]);

  const handleQuickDate = useCallback(
    async (isoDate: string | null) => {
      setDateQuery(isoDate ?? '');
      setFilterError(null);
      await filterByDate(isoDate);
    },
    [filterByDate]
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
        `Are you sure you want to delete the entry for ${formatDisplayDate(
          record.date
        )} (${record.steps.toLocaleString()} steps)?`,
        async () => {
          try {
            await removeRecord(record.id);
          } catch {
            // Error surfaced by HealthContext.
          }
        },
        'Delete',
        true
      );
    },
    [removeRecord]
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
              name="calendar-search"
              size={20}
              color={COLORS.textMuted}
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
                  name="close-circle"
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
            style={[
              styles.chip,
              selectedDateFilter === null && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedDateFilter === null && styles.chipTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleQuickDate(todayISO)}
            style={[
              styles.chip,
              selectedDateFilter === todayISO && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedDateFilter === todayISO && styles.chipTextActive,
              ]}
            >
              Today
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleQuickDate(yesterdayISO)}
            style={[
              styles.chip,
              selectedDateFilter === yesterdayISO && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedDateFilter === yesterdayISO && styles.chipTextActive,
              ]}
            >
              Yesterday
            </Text>
          </Pressable>

          {selectedDateFilter !== null ? (
            <Pressable
              onPress={handleClearFilter}
              style={styles.clearFilterPill}
            >
              <MaterialCommunityIcons
                name="filter-off-outline"
                size={14}
                color={COLORS.error}
              />
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
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
              title={
                selectedDateFilter
                  ? 'No records for this date'
                  : 'No health records yet'
              }
              description={
                selectedDateFilter
                  ? `No entries were found for ${formatDisplayDate(
                      selectedDateFilter
                    )}.`
                  : 'Start tracking your daily steps, calories, and water intake.'
              }
              actionLabel={
                selectedDateFilter ? 'Clear Filter' : 'Log First Entry'
              }
              onAction={
                selectedDateFilter
                  ? handleClearFilter
                  : () => navigation.navigate('AddEditRecord')
              }
            />
          )
        }
      />

      <Pressable
        onPress={() => navigation.navigate('AddEditRecord')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: SPACING.xl + insets.bottom },
          pressed && styles.fabPressed,
        ]}
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
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
    backgroundColor: COLORS.surfaceMuted,
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
    borderRadius: RADII.full,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  clearFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.full,
    backgroundColor: COLORS.errorBg,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
  },
  listContent: {
    padding: SPACING.lg,
  },
  separator: {
    height: SPACING.md,
  },
  pressed: {
    opacity: 0.8,
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
    ...CARD_SHADOW,
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});
