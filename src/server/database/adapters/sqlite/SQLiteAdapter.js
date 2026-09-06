import DatabaseDriver from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export class SQLiteAdapter {
  constructor(filename) {
    const absolutePath = path.resolve(filename);

    fs.mkdirSync(path.dirname(absolutePath), {
      recursive: true,
    });

    this.db = new DatabaseDriver(absolutePath);

    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  prepare(sql) {
    return this.db.prepare(sql);
  }

  transaction(fn) {
    return this.db.transaction(fn);
  }

  close() {
    this.db.close();
  }
}
