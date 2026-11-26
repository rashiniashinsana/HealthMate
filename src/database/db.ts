import * as SQLite from 'expo-sqlite';
import {
  DailySummary,
  DayMetric,
  HealthRecord,
  NewHealthRecordInput,
  WeeklyAnalyticsSummary,
} from '../types/health';
import {
  getOffsetDateISO,
  getTodayISO,
  parseISODate,
} from '../utils/dateUtils';

const DATABASE_NAME = 'healthmate.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Cache the openDatabaseAsync promise so concurrent startup queries share one handle.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbPromise;
}

const SEED_RECORDS: Array<{
  offsetDays: number;
  steps: number;
  calories: number;
  water: number;
}> = [
  { offsetDays: 0, steps: 6420, calories: 380, water: 1500 },
  { offsetDays: -1, steps: 10850, calories: 640, water: 2600 },
  { offsetDays: -2, steps: 8340, calories: 495, water: 2100 },
  { offsetDays: -3, steps: 11200, calories: 690, water: 2750 },
];

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

  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM health_records;'
  );

  if (!countRow || countRow.count === 0) {
    await db.withTransactionAsync(async () => {
      for (const entry of SEED_RECORDS) {
        await db.runAsync(
          'INSERT INTO health_records (date, steps, calories, water) VALUES (?, ?, ?, ?);',
          [
            getOffsetDateISO(entry.offsetDays),
            entry.steps,
            entry.calories,
            entry.water,
          ]
        );
      }
    });
  }
}

export async function insertRecord(
  record: NewHealthRecordInput
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO health_records (date, steps, calories, water) VALUES (?, ?, ?, ?);`
      .trim(),
    [record.date, record.steps, record.calories, record.water]
  );
  return result.lastInsertRowId;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DailyGroupedRow {
  date: string;
  steps: number;
  calories: number;
  water: number;
}

interface RollingAverageRow {
  avgSteps: number;
  avgCalories: number;
  avgWater: number;
}

/**
 * Aggregates daily totals and rolling averages for the trailing 7-day window,
 * padding missing calendar dates with zeros so the chart always renders 7 bars.
 */
export async function getWeeklyAnalytics(
  endDate: string = getTodayISO()
): Promise<WeeklyAnalyticsSummary> {
  const db = await getDatabase();
  const startDate = getOffsetDateISO(-6);

  const [groupedRows, avgRow] = await Promise.all([
    db.getAllAsync<DailyGroupedRow>(
      `SELECT
        date,
        COALESCE(SUM(steps), 0) AS steps,
        COALESCE(SUM(calories), 0) AS calories,
        COALESCE(SUM(water), 0) AS water
       FROM health_records
       WHERE date BETWEEN ? AND ?
       GROUP BY date
       ORDER BY date ASC;`,
      [startDate, endDate]
    ),
    db.getFirstAsync<RollingAverageRow>(
      `SELECT
        COALESCE(AVG(daily_steps), 0) AS avgSteps,
        COALESCE(AVG(daily_calories), 0) AS avgCalories,
        COALESCE(AVG(daily_water), 0) AS avgWater
       FROM (
         SELECT
           SUM(steps) AS daily_steps,
           SUM(calories) AS daily_calories,
           SUM(water) AS daily_water
         FROM health_records
         WHERE date BETWEEN ? AND ?
         GROUP BY date
       );`,
      [startDate, endDate]
    ),
  ]);

  const byDate = new Map<string, DailyGroupedRow>();
  for (const row of groupedRows) {
    byDate.set(row.date, row);
  }

  const days: DayMetric[] = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const isoDate = getOffsetDateISO(offset);
    const parsed = parseISODate(isoDate);
    const label = parsed ? WEEKDAY_LABELS[parsed.getDay()] : isoDate.slice(5);
    const existing = byDate.get(isoDate);

    days.push({
      date: isoDate,
      label,
      steps: existing?.steps ?? 0,
      calories: existing?.calories ?? 0,
      water: existing?.water ?? 0,
    });
  }

  return {
    days,
    avgSteps: Math.round(avgRow?.avgSteps ?? 0),
    avgCalories: Math.round(avgRow?.avgCalories ?? 0),
    avgWater: Math.round(avgRow?.avgWater ?? 0),
  };
}

export async function getAllRecords(): Promise<HealthRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<HealthRecord>(
    'SELECT id, date, steps, calories, water FROM health_records ORDER BY date DESC, id DESC;'
  );
}

export async function getRecordsByDate(date: string): Promise<HealthRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<HealthRecord>(
    'SELECT id, date, steps, calories, water FROM health_records WHERE date = ? ORDER BY id DESC;',
    [date]
  );
}

export async function updateRecord(
  id: number,
  record: NewHealthRecordInput
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE health_records SET date = ?, steps = ?, calories = ?, water = ? WHERE id = ?;',
    [record.date, record.steps, record.calories, record.water, id]
  );
}

export async function deleteRecord(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM health_records WHERE id = ?;', [id]);
}

export async function getTodaySummary(
  date: string = getTodayISO()
): Promise<DailySummary> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DailySummary>(
    `SELECT
      COALESCE(SUM(steps), 0) AS totalSteps,
      COALESCE(SUM(calories), 0) AS totalCalories,
      COALESCE(SUM(water), 0) AS totalWater
     FROM health_records
     WHERE date = ?;`,
    [date]
  );

  return {
    totalSteps: row?.totalSteps ?? 0,
    totalCalories: row?.totalCalories ?? 0,
    totalWater: row?.totalWater ?? 0,
  };
}

export async function clearAllRecords(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM health_records;');
}

export async function resetSampleData(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM health_records;');
    for (const entry of SEED_RECORDS) {
      await db.runAsync(
        'INSERT INTO health_records (date, steps, calories, water) VALUES (?, ?, ?, ?);',
        [
          getOffsetDateISO(entry.offsetDays),
          entry.steps,
          entry.calories,
          entry.water,
        ]
      );
    }
  });
}
