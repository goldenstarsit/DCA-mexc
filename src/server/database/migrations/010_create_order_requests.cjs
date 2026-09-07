module.exports = {
  id: '010_create_order_requests',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS order_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_key TEXT NOT NULL UNIQUE,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL,
        status TEXT NOT NULL DEFAULT 'PROCESSING'
          CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
        exchange_order_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_order_requests_key
      ON order_requests(request_key);

      CREATE INDEX IF NOT EXISTS idx_order_requests_status
      ON order_requests(status);
    `);
  },
};
