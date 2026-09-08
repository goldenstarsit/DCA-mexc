import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const backupFile = process.argv[2];

if (!backupFile) {
  throw new Error(
    'Usage: pnpm db:restore <backup-file>'
  );
}

const backupPath = path.resolve(backupFile);

if (!fs.existsSync(backupPath)) {
  throw new Error(
    `Backup not found: ${backupPath}`
  );
}

const targetFile =
  process.env.DATABASE_FILE || './data/dca-mexc.db';

const targetPath = path.resolve(targetFile);

fs.mkdirSync(path.dirname(targetPath), {
  recursive: true,
});

const backupDb = new Database(backupPath);

try {
  await backupDb.backup(targetPath);

  console.log(
    `Database restored: ${targetPath}`
  );
} finally {
  backupDb.close();
}
