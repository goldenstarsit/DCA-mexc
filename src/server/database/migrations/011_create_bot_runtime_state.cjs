module.exports = {
  id: '011_create_bot_runtime_state',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS bot_runtime_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        state TEXT NOT NULL DEFAULT 'STOPPED'
          CHECK (
            state IN (
              'STOPPED',
              'RUNNING',
              'PAUSED'
            )
          ),
        updated_at TEXT NOT NULL
      );

      INSERT OR IGNORE INTO bot_runtime_state (
        id,
        state,
        updated_at
      )
      VALUES (
        1,
        'STOPPED',
        datetime('now')
      );
    `);
  },
};
