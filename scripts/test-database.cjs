require('dotenv').config({
  path: '.env.local'
});

const Database = require('better-sqlite3');

const db = new Database(
  process.env.DATABASE_FILE ||
    './data/dca-mexc.db'
);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = db
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
  `)
  .all();

const migrations = db
  .prepare(`
    SELECT migration_id, applied_at
    FROM schema_migrations
    ORDER BY id
  `)
  .all();

const meta = db
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name = 'app_meta'
  `)
  .get();

if (!meta) {
  throw new Error('app_meta table missing');
}

if (migrations.length !== 2) {
  throw new Error(
    `Expected 2 migrations, found ${migrations.length}`
  );
}

console.log('Database Foundation OK');
console.log('Tables:');
console.table(schema);
console.log('Migrations:');
console.table(migrations);

db.close();
