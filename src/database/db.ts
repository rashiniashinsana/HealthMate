import * as SQLite from 'expo-sqlite';
import {
  DailySummary,
  HealthRecord,
  NewHealthRecordInput,
} from '../types/health';
import { getOffsetDateISO, getTodayISO } from '../utils/dateUtils';

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
    'INSERT INTO health_records (date, steps, calories, water) VALUES (?, ?, ?, ?);',
    [record.date, record.steps, record.calories, record.water]
  );
  return result.lastInsertRowId;
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
