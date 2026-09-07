import { BaseRepository } from '../database/repositories/BaseRepository.js';

export class BotConfigRepository extends BaseRepository {
  get() {
    const row = this.prepare(`
      SELECT id, config_json, updated_at
      FROM bot_config
      WHERE id = 1
    `).get();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      config: JSON.parse(row.config_json),
      updatedAt: row.updated_at,
    };
  }

  save(config) {
    const now = new Date().toISOString();

    this.prepare(`
      INSERT INTO bot_config (
        id,
        config_json,
        updated_at
      )
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        config_json = excluded.config_json,
        updated_at = excluded.updated_at
    `).run(
      JSON.stringify(config),
      now
    );

    return this.get();
  }

  delete() {
    return this.prepare(`
      DELETE FROM bot_config
      WHERE id = 1
    `).run();
  }
}
