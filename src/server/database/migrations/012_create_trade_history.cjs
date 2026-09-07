module.exports = {
  id: '012_create_trade_history',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS trade_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        invested_amount REAL NOT NULL DEFAULT 0,
        realized_pnl REAL NOT NULL DEFAULT 0,
        realized_pnl_percent REAL NOT NULL DEFAULT 0,
        entry_price REAL,
        exit_price REAL,
        position_id INTEGER,
        entry_order_id INTEGER,
        exit_order_id INTEGER,
        opened_at TEXT,
        closed_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_trade_history_symbol
      ON trade_history(symbol);

      CREATE INDEX IF NOT EXISTS idx_trade_history_closed_at
      ON trade_history(closed_at);

      CREATE INDEX IF NOT EXISTS idx_trade_history_position_id
      ON trade_history(position_id);
    `);
  },
};
