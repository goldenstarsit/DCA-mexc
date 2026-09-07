module.exports = {
  id: '004_create_trading_pair',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS trading_pair_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        symbol TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }
};
