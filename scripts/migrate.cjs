require('dotenv').config({
  path: '.env.local'
});

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const databaseFile =
  process.env.DATABASE_FILE || './data/dca-mexc.db';

const absolutePath = path.resolve(databaseFile);

fs.mkdirSync(path.dirname(absolutePath), {
  recursive: true
});

const db = new Database(absolutePath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const migrationsDir = path.resolve(
  'src/server/database/migrations'
);

const files = fs
  .readdirSync(migrationsDir)
  .filter(file => file.endsWith('.cjs'))
  .sort();

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_id TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const applied = new Set(
  db
    .prepare(
      'SELECT migration_id FROM schema_migrations'
    )
    .all()
    .map(row => row.migration_id)
);

const insertMigration = db.prepare(`
  INSERT INTO schema_migrations (migration_id)
  VALUES (?)
`);

let appliedCount = 0;

for (const file of files) {
  const migration = require(
    path.join(migrationsDir, file)
  );

  if (!migration.id || typeof migration.up !== 'function') {
    throw new Error(
      `Invalid migration: ${file}`
    );
  }

  if (applied.has(migration.id)) {
    continue;
  }

  const runMigration = db.transaction(() => {
    migration.up(db);
    insertMigration.run(migration.id);
  });

  runMigration();

  console.log(`Applied: ${migration.id}`);
  appliedCount++;
}

const migrations = db
  .prepare(`
    SELECT migration_id, applied_at
    FROM schema_migrations
    ORDER BY id
  `)
  .all();

console.log(`Migrations applied now: ${appliedCount}`);
console.log('Migration status:');
console.table(migrations);

db.close();
