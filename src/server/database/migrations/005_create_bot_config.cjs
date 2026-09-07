module.exports = {
  id: '005_create_bot_config',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS bot_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        config_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }
};
