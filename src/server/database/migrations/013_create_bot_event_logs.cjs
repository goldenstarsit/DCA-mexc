module.exports = {
  id: '013_create_bot_event_logs',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS bot_event_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        level TEXT NOT NULL DEFAULT 'INFO'
          CHECK (level IN ('INFO','WARNING','ERROR')),
        message TEXT NOT NULL,
        symbol TEXT,
        details TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_bot_event_logs_created_at
      ON bot_event_logs(created_at);

      CREATE INDEX IF NOT EXISTS idx_bot_event_logs_event_type
      ON bot_event_logs(event_type);

      CREATE INDEX IF NOT EXISTS idx_bot_event_logs_level
      ON bot_event_logs(level);
    `);
  },
};
