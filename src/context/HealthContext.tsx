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
  loading: boolean;
  error: string | null;
  selectedDateFilter: string | null;
  refreshData: () => Promise<void>;
  refreshRecords: () => Promise<void>;
  addRecord: (entry: NewHealthRecordInput) => Promise<void>;
  editRecord: (id: number, entry: NewHealthRecordInput) => Promise<void>;
  removeRecord: (id: number) => Promise<void>;
  filterByDate: (date: string | null) => Promise<void>;
  quickAddWater: (amount?: number) => Promise<void>;
  quickLogWater: (amount?: number) => Promise<void>;
  clearAllData: () => Promise<void>;
  resetToSampleData: () => Promise<void>;
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
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    null
  );

  // Track active filter in a ref so mutations refresh the currently filtered view.
  const activeFilterRef = useRef<string | null>(null);
  activeFilterRef.current = selectedDateFilter;

  const loadSnapshot = useCallback(async (filterDate: string | null) => {
    const [fetchedRecords, summary, weekly] = await Promise.all([
      filterDate ? getRecordsByDate(filterDate) : getAllRecords(),
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

  const filterByDate = useCallback(
    async (date: string | null) => {
      const normalized = date && date.trim().length > 0 ? date.trim() : null;
      try {
        setIsLoading(true);
        setError(null);
        setSelectedDateFilter(normalized);
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

  const addRecord = useCallback(
    async (entry: NewHealthRecordInput) => {
      try {
        setError(null);
        assertValidEntry(entry);
        await insertRecord(entry);
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

  const editRecord = useCallback(
    async (id: number, entry: NewHealthRecordInput) => {
      try {
        setError(null);
        assertValidEntry(entry);
        await updateRecord(id, entry);
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

  const removeRecord = useCallback(
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
    async (amount: number = QUICK_WATER_INCREMENT_ML) => {
      try {
        setError(null);
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error('Water increment must be a positive amount.');
        }
        await addQuickWater(amount);
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

  const clearAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedDateFilter(null);
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

  const resetToSampleData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedDateFilter(null);
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
      loading: isLoading,
      error,
      selectedDateFilter,
      refreshData,
      refreshRecords: refreshData,
      addRecord,
      editRecord,
      removeRecord,
      filterByDate,
      quickAddWater,
      quickLogWater: quickAddWater,
      clearAllData,
      resetToSampleData,
      clearError,
    }),
    [
      records,
      todaySummary,
      weeklyStats,
      isInitialized,
      isLoading,
      error,
      selectedDateFilter,
      refreshData,
      addRecord,
      editRecord,
      removeRecord,
      filterByDate,
      quickAddWater,
      clearAllData,
      resetToSampleData,
      clearError,
    ]
  );

  return (
    <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
  );
};

export { useHealth } from '../hooks/useHealth';
