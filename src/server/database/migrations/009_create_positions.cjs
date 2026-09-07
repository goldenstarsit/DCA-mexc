module.exports = {
  id: '009_create_positions',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'OPEN'
          CHECK (status IN ('OPEN', 'CLOSED')),
        quantity REAL NOT NULL,
        invested_amount REAL NOT NULL,
        average_entry_price REAL NOT NULL,
        opened_at TEXT NOT NULL,
        closed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_positions_symbol_status
      ON positions(symbol, status);

      CREATE INDEX IF NOT EXISTS idx_positions_status
      ON positions(status);
    `);
  },
};
