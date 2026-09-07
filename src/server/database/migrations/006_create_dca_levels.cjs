module.exports = {
  id: '006_create_dca_levels',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS dca_levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level INTEGER NOT NULL UNIQUE,
        trigger_percent REAL NOT NULL,
        quantity REAL NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_dca_levels_level
      ON dca_levels(level);
    `);
  }
};
