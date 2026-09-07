module.exports = {
  id: '007_create_dca_trigger_config',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS dca_trigger_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        trigger_mode TEXT NOT NULL DEFAULT 'PRICE_DROP',
        require_price_below_entry INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
      );
    `);
  }
};
