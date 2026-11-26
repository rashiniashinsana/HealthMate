import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'healthmate.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Returns the shared SQLite database connection.
 * Caching the promise prevents concurrent open calls during app startup.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbPromise;
}
