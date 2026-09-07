module.exports = {
  id: '008_create_dca_quantity_config',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS dca_quantity_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        quantity_mode TEXT NOT NULL DEFAULT 'FIXED',
        updated_at TEXT NOT NULL
      );
    `);
  }
};
