import { Database } from './core/Database.js';
import { SQLiteAdapter } from './adapters/sqlite/SQLiteAdapter.js';

let databaseInstance = null;

export function getDatabase() {
  if (!databaseInstance) {
    const databaseFile =
      process.env.DATABASE_FILE ||
      './data/dca-mexc.db';

    databaseInstance = new Database(
      new SQLiteAdapter(databaseFile)
    );
  }

  return databaseInstance;
}
