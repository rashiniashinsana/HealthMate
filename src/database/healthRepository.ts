import {
  DailySummary,
  HealthRecord,
  WeeklyStats,
} from '../models/HealthRecord';
import { getOffsetDateISO, getTodayISO } from '../utils/dateUtils';
import {
  deleteRecord,
  getAllRecords,
  getDatabase,
  getRecordsByDate,
  getTodaySummary as getDbTodaySummary,
  initDatabase,
  insertRecord,
  updateRecord,
} from './db';

export {
  deleteRecord,
  getAllRecords,
  getRecordsByDate as getRecordByDate,
  initDatabase,
  insertRecord,
  updateRecord,
};

interface CountRow {
  recordCount: number;
}

interface WeeklyRow {
  totalSteps: number;
  totalCalories: number;
  totalWater: number;
  daysLogged: number;
}

export async function getTodaySummary(
  date: string = getTodayISO()
): Promise<DailySummary> {
  const db = await getDatabase();
  const [totals, countRow] = await Promise.all([
    getDbTodaySummary(date),
    db.getFirstAsync<CountRow>(
      'SELECT COUNT(*) AS recordCount FROM health_records WHERE date = ?;',
      [date]
    ),
  ]);

  return {
    date,
    ...totals,
    recordCount: countRow?.recordCount ?? 0,
  };
}

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
