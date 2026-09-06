import { Database } from './core/Database.js';
import { SQLiteAdapter } from './adapters/sqlite/SQLiteAdapter.js';

const databaseFile =
  process.env.DATABASE_FILE || './data/dca-mexc.db';

export const db = new Database(
  new SQLiteAdapter(databaseFile)
);
