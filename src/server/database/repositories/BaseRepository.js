export class BaseRepository {
  constructor(db) {
    this.db = db;
    this.statementCache = new Map();
  }

  prepare(sql) {
    if (!this.statementCache.has(sql)) {
      this.statementCache.set(sql, this.db.prepare(sql));
    }

    return this.statementCache.get(sql);
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  transaction(fn) {
    return this.db.transaction(fn);
  }

  clearStatementCache() {
    this.statementCache.clear();
  }
}
