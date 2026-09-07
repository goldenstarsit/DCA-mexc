import { BaseRepository } from '../database/repositories/BaseRepository.js';

export class TradingPairRepository extends BaseRepository {
  get() {
    return this.prepare(`
      SELECT id, symbol, updated_at
      FROM trading_pair_config
      WHERE id = 1
    `).get() ?? null;
  }

  save(symbol) {
    const now = new Date().toISOString();

    this.prepare(`
      INSERT INTO trading_pair_config (id, symbol, updated_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        symbol = excluded.symbol,
        updated_at = excluded.updated_at
    `).run(symbol, now);

    return this.get();
  }

  delete() {
    return this.prepare(`
      DELETE FROM trading_pair_config
      WHERE id = 1
    `).run();
  }
}
