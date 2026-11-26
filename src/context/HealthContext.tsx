import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  clearAllRecords,
  deleteRecord,
  getAllRecords,
  getRecordsByDate,
  initDatabase,
  insertRecord,
  resetSampleData,
  updateRecord,
} from '../database/db';
import {
  addQuickWater,
  getTodaySummary,
  getWeeklyStats,
} from '../database/healthRepository';
import {
  DailySummary as ExtendedDailySummary,
  WeeklyStats,
} from '../models/HealthRecord';
import { HealthRecord, NewHealthRecordInput } from '../types/health';
import { QUICK_WATER_INCREMENT_ML } from '../utils/constants';
import { getTodayISO } from '../utils/dateUtils';
import {
  hasValidationErrors,
  validateHealthForm,
} from '../utils/validation';

export interface HealthContextValue {
  records: HealthRecord[];
  todaySummary: ExtendedDailySummary;
  weeklyStats: WeeklyStats;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  dateFilter: string | null;
  refreshData: () => Promise<void>;
  addEntry: (record: NewHealthRecordInput) => Promise<void>;
  updateEntry: (id: number, record: NewHealthRecordInput) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  quickAddWater: (ml?: number) => Promise<void>;
  setDateFilter: (date: string | null) => Promise<void>;
  resetToDummyData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_SUMMARY: ExtendedDailySummary = {
  date: getTodayISO(),
  totalSteps: 0,
  totalCalories: 0,
  totalWater: 0,
  recordCount: 0,
};

const DEFAULT_WEEKLY_STATS: WeeklyStats = {
  averageSteps: 0,
  averageCalories: 0,
  averageWater: 0,
  daysLogged: 0,
  totalSteps: 0,
  totalCalories: 0,
  totalWater: 0,
};

export const HealthContext = createContext<HealthContextValue | undefined>(
  undefined
);

function assertValidEntry(entry: NewHealthRecordInput): void {
  const errors = validateHealthForm({
    date: entry.date,
    steps: String(entry.steps),
    calories: String(entry.calories),
    water: String(entry.water),
  });
  if (hasValidationErrors(errors)) {
    const firstError = Object.values(errors).find(Boolean);
    throw new Error(firstError ?? 'Invalid health record input.');
  }
}

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [todaySummary, setTodaySummary] =
    useState<ExtendedDailySummary>(DEFAULT_SUMMARY);
  const [weeklyStats, setWeeklyStats] =
    useState<WeeklyStats>(DEFAULT_WEEKLY_STATS);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilterState] = useState<string | null>(null);

  // Track active filter in a ref so mutations refresh the currently filtered view.
  const activeFilterRef = useRef<string | null>(null);
  activeFilterRef.current = dateFilter;

  const loadSnapshot = useCallback(async (activeDate: string | null) => {
    const [fetchedRecords, summary, weekly] = await Promise.all([
      activeDate ? getRecordsByDate(activeDate) : getAllRecords(),
      getTodaySummary(),
      getWeeklyStats(),
    ]);
    setRecords(fetchedRecords);
    setTodaySummary(summary);
    setWeeklyStats(weekly);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        await initDatabase();
        if (mounted) {
          await loadSnapshot(null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to initialize health database.'
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadSnapshot]);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loadSnapshot(activeFilterRef.current);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh health data.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadSnapshot]);

  const setDateFilter = useCallback(
    async (date: string | null) => {
      const normalized = date && date.trim().length > 0 ? date.trim() : null;
      try {
        setIsLoading(true);
        setError(null);
        setDateFilterState(normalized);
        await loadSnapshot(normalized);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to filter records.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [loadSnapshot]
  );

  const addEntry = useCallback(
    async (record: NewHealthRecordInput) => {
      try {
        setError(null);
        assertValidEntry(record);
        await insertRecord(record);
        await loadSnapshot(activeFilterRef.current);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to save record.';
        setError(message);
        throw err;
      }
    },
    [loadSnapshot]
  );

  const updateEntry = useCallback(
    async (id: number, record: NewHealthRecordInput) => {
      try {
        setError(null);
        assertValidEntry(record);
        await updateRecord(id, record);
        await loadSnapshot(activeFilterRef.current);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update record.';
        setError(message);
        throw err;
      }
    },
    [loadSnapshot]
  );

  const deleteEntry = useCallback(
    async (id: number) => {
      try {
        setError(null);
        await deleteRecord(id);
        await loadSnapshot(activeFilterRef.current);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete record.';
        setError(message);
        throw err;
      }
    },
    [loadSnapshot]
  );

  const quickAddWater = useCallback(
    async (ml: number = QUICK_WATER_INCREMENT_ML) => {
      try {
        setError(null);
        if (!Number.isFinite(ml) || ml <= 0) {
          throw new Error('Water increment must be a positive amount.');
        }
        await addQuickWater(ml);
        await loadSnapshot(activeFilterRef.current);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to log water intake.';
        setError(message);
        throw err;
      }
    },
    [loadSnapshot]
  );

  const resetToDummyData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDateFilterState(null);
      await resetSampleData();
      await loadSnapshot(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to reset sample data.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadSnapshot]);

  const clearAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDateFilterState(null);
      await clearAllRecords();
      await loadSnapshot(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to clear health records.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadSnapshot]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<HealthContextValue>(
    () => ({
      records,
      todaySummary,
      weeklyStats,
      isInitialized,
      isLoading,
      error,
      dateFilter,
      refreshData,
      addEntry,
      updateEntry,
      deleteEntry,
      quickAddWater,
      setDateFilter,
      resetToDummyData,
      clearAllData,
      clearError,
    }),
    [
      records,
      todaySummary,
      weeklyStats,
      isInitialized,
      isLoading,
      error,
      dateFilter,
      refreshData,
      addEntry,
      updateEntry,
      deleteEntry,
      quickAddWater,
      setDateFilter,
      resetToDummyData,
      clearAllData,
      clearError,
    ]
  );

  return (
    <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
  );
};

export { useHealth } from '../hooks/useHealth';
