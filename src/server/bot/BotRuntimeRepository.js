import { BaseRepository } from '../database/repositories/BaseRepository.js';

export class BotRuntimeRepository extends BaseRepository {
  get() {
    return this.prepare(`
      SELECT *
      FROM bot_runtime_state
      WHERE id = 1
    `).get() ?? null;
  }

  setState(state) {
    const now = new Date().toISOString();

    this.prepare(`
      UPDATE bot_runtime_state
      SET
        state = ?,
        updated_at = ?
      WHERE id = 1
    `).run(state, now);

    return this.get();
  }
}
