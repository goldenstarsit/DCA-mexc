export class DcaTriggerConfigRepository {
  constructor(db) {
    this.db = db;
  }

  get() {
    return this.db
      .prepare(`
        SELECT
          id,
          trigger_mode,
          require_price_below_entry,
          updated_at
        FROM dca_trigger_config
        WHERE id = 1
      `)
      .get();
  }

  save(config) {
    const now = new Date().toISOString();

    this.db
      .prepare(`
        INSERT INTO dca_trigger_config (
          id,
          trigger_mode,
          require_price_below_entry,
          updated_at
        )
        VALUES (1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          trigger_mode = excluded.trigger_mode,
          require_price_below_entry = excluded.require_price_below_entry,
          updated_at = excluded.updated_at
      `)
      .run(
        config.triggerMode,
        config.requirePriceBelowEntry ? 1 : 0,
        now
      );

    return this.get();
  }

  delete() {
    return this.db
      .prepare(`
        DELETE FROM dca_trigger_config
        WHERE id = 1
      `)
      .run();
  }
}
