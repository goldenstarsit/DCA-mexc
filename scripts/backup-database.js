import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const sourceFile =
  process.env.DATABASE_FILE || './data/dca-mexc.db';

const sourcePath = path.resolve(sourceFile);
const backupDir = path.resolve('./scripts/backups');

fs.mkdirSync(backupDir, {
  recursive: true,
});

if (!fs.existsSync(sourcePath)) {
  throw new Error(
    `Database not found: ${sourcePath}`
  );
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-');

const backupPath = path.join(
  backupDir,
  `dca-mexc-${timestamp}.db`
);

const db = new Database(sourcePath);

try {
  await db.backup(backupPath);

  console.log(
    `Database backup created: ${backupPath}`
  );
} finally {
  db.close();
}
