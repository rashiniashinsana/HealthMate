import {
  DailySummary,
  HealthRecord,
  HealthRecordInput,
  WeeklyStats,
} from '../models/HealthRecord';
import { getOffsetDateISO, getTodayISO } from '../utils/dateUtils';
import { getDatabase } from './db';

interface CountRow {
  count: number;
}

interface SummaryRow {
  totalSteps: number;
  totalCalories: number;
  totalWater: number;
  recordCount: number;
}

interface WeeklyRow {
  totalSteps: number;
  totalCalories: number;
  totalWater: number;
  daysLogged: number;
}

const SEED_OFFSETS: Array<{
  offset: number;
  steps: number;
  calories: number;
  water: number;
}> = [
  { offset: 0, steps: 6420, calories: 380, water: 1500 },
  { offset: -1, steps: 10850, calories: 640, water: 2600 },
  { offset: -2, steps: 8340, calories: 495, water: 2100 },
  { offset: -3, steps: 11200, calories: 690, water: 2750 },
  { offset: -4, steps: 5900, calories: 340, water: 1750 },
  { offset: -5, steps: 9450, calories: 560, water: 2250 },
  { offset: -6, steps: 12100, calories: 720, water: 3000 },
  { offset: -7, steps: 7600, calories: 440, water: 1900 },
  { offset: -8, steps: 8900, calories: 510, water: 2300 },
  { offset: -9, steps: 10300, calories: 615, water: 2500 },
];

/**
 * Initializes the `health_records` table and seeds realistic sample data if empty.
 */
export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      steps INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      water INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_health_records_date ON health_records(date);
  `);

  const row = await db.getFirstAsync<CountRow>(
    'SELECT COUNT(*) AS count FROM health_records;'
  );

  if (!row || row.count === 0) {
    await db.withTransactionAsync(async () => {
      for (const item of SEED_OFFSETS) {
        await db.runAsync(
          'INSERT INTO health_records (date, steps, calories, water) VALUES (?, ?, ?, ?);',
          [getOffsetDateISO(item.offset), item.steps, item.calories, item.water]
        );
      }
    });
  }
}

/**
 * Fetches all health records sorted by date descending, then most recently inserted.
 */
export async function getAllRecords(): Promise<HealthRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<HealthRecord>(
    'SELECT id, date, steps, calories, water FROM health_records ORDER BY date DESC, id DESC;'
  );
}

/**
 * Retrieves all health records for a specific `YYYY-MM-DD` date.
 */
export async function getRecordByDate(date: string): Promise<HealthRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<HealthRecord>(
    'SELECT id, date, steps, calories, water FROM health_records WHERE date = ? ORDER BY id DESC;',
    [date]
  );
}

/**
 * Inserts a new daily health record and returns its generated row ID.
 */
export async function insertRecord(record: HealthRecordInput): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO health_records (date, steps, calories, water) VALUES (?, ?, ?, ?);',
    [record.date, record.steps, record.calories, record.water]
  );
  return result.lastInsertRowId;
}

/**
 * Updates an existing health record by ID.
 */
export async function updateRecord(
  id: number,
  record: HealthRecordInput
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE health_records SET date = ?, steps = ?, calories = ?, water = ? WHERE id = ?;',
    [record.date, record.steps, record.calories, record.water, id]
  );
}

/**
 * Deletes a health record by ID.
 */
export async function deleteRecord(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM health_records WHERE id = ?;', [id]);
}

/**
 * Aggregates total steps, calories, and water for the given date (defaults to today).
 */
export async function getTodaySummary(
  date: string = getTodayISO()
): Promise<DailySummary> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SummaryRow>(
    `SELECT
      COALESCE(SUM(steps), 0) AS totalSteps,
      COALESCE(SUM(calories), 0) AS totalCalories,
      COALESCE(SUM(water), 0) AS totalWater,
      COUNT(*) AS recordCount
     FROM health_records
     WHERE date = ?;`,
    [date]
  );

  return {
    date,
    totalSteps: row?.totalSteps ?? 0,
    totalCalories: row?.totalCalories ?? 0,
    totalWater: row?.totalWater ?? 0,
    recordCount: row?.recordCount ?? 0,
  };
}

/**
 * Computes 7-day rolling totals and daily averages ending on `endDate` (inclusive).
 */
export async function getWeeklyStats(
  endDate: string = getTodayISO()
): Promise<WeeklyStats> {
  const db = await getDatabase();
  const startDate = getOffsetDateISO(-6);

  const row = await db.getFirstAsync<WeeklyRow>(
    `SELECT
      COALESCE(SUM(steps), 0) AS totalSteps,
      COALESCE(SUM(calories), 0) AS totalCalories,
      COALESCE(SUM(water), 0) AS totalWater,
      COUNT(DISTINCT date) AS daysLogged
     FROM health_records
     WHERE date BETWEEN ? AND ?;`,
    [startDate, endDate]
  );

  const daysLogged = row?.daysLogged ?? 0;
  const divisor = daysLogged > 0 ? daysLogged : 1;

  return {
    totalSteps: row?.totalSteps ?? 0,
    totalCalories: row?.totalCalories ?? 0,
    totalWater: row?.totalWater ?? 0,
    daysLogged,
    averageSteps: daysLogged > 0 ? Math.round((row?.totalSteps ?? 0) / divisor) : 0,
    averageCalories:
      daysLogged > 0 ? Math.round((row?.totalCalories ?? 0) / divisor) : 0,
    averageWater: daysLogged > 0 ? Math.round((row?.totalWater ?? 0) / divisor) : 0,
  };
}

/**
 * Increments today's water intake by `amountMl`.
 * Updates the latest record for today if one exists, otherwise creates a new entry for today.
 */
export async function addQuickWater(
  amountMl: number,
  date: string = getTodayISO()
): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<HealthRecord>(
    'SELECT id, date, steps, calories, water FROM health_records WHERE date = ? ORDER BY id DESC LIMIT 1;',
    [date]
  );

  if (existing) {
    await db.runAsync('UPDATE health_records SET water = ? WHERE id = ?;', [
      existing.water + amountMl,
      existing.id,
    ]);
  } else {
    await db.runAsync(
      'INSERT INTO health_records (date, steps, calories, water) VALUES (?, 0, 0, ?);',
      [date, amountMl]
    );
  }
}

/**
 * Formats all records into CSV or JSON for data export.
 */
export function serializeRecords(
  records: HealthRecord[],
  format: 'csv' | 'json'
): string {
  if (format === 'json') {
    return JSON.stringify(records, null, 2);
  }

  const header = 'id,date,steps,calories,water_ml';
  const rows = records.map(
    (r) => `${r.id},${r.date},${r.steps},${r.calories},${r.water}`
  );
  return [header, ...rows].join('\n');
}
