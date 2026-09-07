module.exports = {
  id: '003_create_mexc_credentials',

  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS mexc_credentials (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        api_key_encrypted TEXT NOT NULL,
        secret_key_encrypted TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }
};
