import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addQuickWater,
  deleteRecord,
  getAllRecords,
  getRecordByDate,
  getTodaySummary,
  getWeeklyStats,
  initDatabase,
  insertRecord,
  updateRecord,
} from '../database/healthRepository';
import {
  DailySummary,
  HealthRecord,
  HealthRecordInput,
  WeeklyStats,
} from '../models/HealthRecord';
import { QUICK_WATER_INCREMENT_ML } from '../utils/constants';
import { getTodayISO } from '../utils/dateUtils';

interface HealthContextValue {
  records: HealthRecord[];
  todaySummary: DailySummary;
  weeklyStats: WeeklyStats;
  loading: boolean;
  error: string | null;
  selectedDateFilter: string | null;
  addRecord: (input: HealthRecordInput) => Promise<void>;
  editRecord: (id: number, input: HealthRecordInput) => Promise<void>;
  removeRecord: (id: number) => Promise<void>;
  refreshRecords: () => Promise<void>;
  filterByDate: (date: string | null) => Promise<void>;
  quickLogWater: (amountMl?: number) => Promise<void>;
  clearError: () => void;
}

const DEFAULT_SUMMARY: DailySummary = {
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

const HealthContext = createContext<HealthContextValue | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [todaySummary, setTodaySummary] =
    useState<DailySummary>(DEFAULT_SUMMARY);
  const [weeklyStats, setWeeklyStats] =
    useState<WeeklyStats>(DEFAULT_WEEKLY_STATS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    null
  );

  const activeFilterRef = useRef<string | null>(null);
  activeFilterRef.current = selectedDateFilter;

  const loadData = useCallback(async (filterDate: string | null) => {
    const [fetchedRecords, summary, weekly] = await Promise.all([
      filterDate ? getRecordByDate(filterDate) : getAllRecords(),
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
        setLoading(true);
        setError(null);
        await initDatabase();
        if (mounted) {
          await loadData(null);
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
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadData]);

  const refreshRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await loadData(activeFilterRef.current);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh records.'
      );
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const filterByDate = useCallback(
    async (date: string | null) => {
      const normalized = date && date.trim().length > 0 ? date.trim() : null;
      try {
        setLoading(true);
        setError(null);
        setSelectedDateFilter(normalized);
        await loadData(normalized);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to filter records.'
        );
      } finally {
        setLoading(false);
      }
    },
    [loadData]
  );

  const addRecord = useCallback(
    async (input: HealthRecordInput) => {
      try {
        setError(null);
        await insertRecord(input);
        await loadData(activeFilterRef.current);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to save record.';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const editRecord = useCallback(
    async (id: number, input: HealthRecordInput) => {
      try {
        setError(null);
        await updateRecord(id, input);
        await loadData(activeFilterRef.current);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update record.';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const removeRecord = useCallback(
    async (id: number) => {
      try {
        setError(null);
        await deleteRecord(id);
        await loadData(activeFilterRef.current);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete record.';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const quickLogWater = useCallback(
    async (amountMl: number = QUICK_WATER_INCREMENT_ML) => {
      try {
        setError(null);
        await addQuickWater(amountMl);
        await loadData(activeFilterRef.current);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to log water intake.';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<HealthContextValue>(
    () => ({
      records,
      todaySummary,
      weeklyStats,
      loading,
      error,
      selectedDateFilter,
      addRecord,
      editRecord,
      removeRecord,
      refreshRecords,
      filterByDate,
      quickLogWater,
      clearError,
    }),
    [
      records,
      todaySummary,
      weeklyStats,
      loading,
      error,
      selectedDateFilter,
      addRecord,
      editRecord,
      removeRecord,
      refreshRecords,
      filterByDate,
      quickLogWater,
      clearError,
    ]
  );

  return (
    <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
  );
};

/**
 * Custom hook to access HealthMate state and database actions.
 */
export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) {
    throw new Error('useHealth must be used within a HealthProvider.');
  }
  return ctx;
}
