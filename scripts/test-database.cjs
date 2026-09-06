require('dotenv').config({
  path: '.env.local',
});

const Database = require('better-sqlite3');

const db = new Database(
  process.env.DATABASE_FILE || './data/dca-mexc.db'
);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS system_test (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const insert = db.prepare(
  'INSERT INTO system_test (message) VALUES (?)'
);

insert.run('dca-mexc database initialized');

const row = db
  .prepare(
    'SELECT * FROM system_test ORDER BY id DESC LIMIT 1'
  )
  .get();

console.log('Database OK');
console.log(row);

db.close();
