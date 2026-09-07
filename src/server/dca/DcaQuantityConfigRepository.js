export class DcaQuantityConfigRepository {
  constructor(db) {
    this.db = db;
  }

  get() {
    return this.db
      .prepare(`
        SELECT
          id,
          quantity_mode,
          updated_at
        FROM dca_quantity_config
        WHERE id = 1
      `)
      .get();
  }

  save(config) {
    const now = new Date().toISOString();

    this.db
      .prepare(`
        INSERT INTO dca_quantity_config (
          id,
          quantity_mode,
          updated_at
        )
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          quantity_mode = excluded.quantity_mode,
          updated_at = excluded.updated_at
      `)
      .run(
        config.quantityMode,
        now
      );

    return this.get();
  }

  delete() {
    return this.db
      .prepare(`
        DELETE FROM dca_quantity_config
        WHERE id = 1
      `)
      .run();
  }
}
