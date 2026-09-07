import { BaseRepository } from '../database/repositories/BaseRepository.js';

export class PositionRepository extends BaseRepository {
  getById(id) {
    return this.prepare(`
      SELECT
        id,
        symbol,
        status,
        quantity,
        invested_amount,
        average_entry_price,
        opened_at,
        closed_at,
        created_at,
        updated_at
      FROM positions
      WHERE id = ?
    `).get(id) ?? null;
  }

  getOpenBySymbol(symbol) {
    return this.prepare(`
      SELECT
        id,
        symbol,
        status,
        quantity,
        invested_amount,
        average_entry_price,
        opened_at,
        closed_at,
        created_at,
        updated_at
      FROM positions
      WHERE symbol = ?
        AND status = 'OPEN'
      ORDER BY id DESC
      LIMIT 1
    `).get(symbol) ?? null;
  }

  getOpen() {
    return this.prepare(`
      SELECT
        id,
        symbol,
        status,
        quantity,
        invested_amount,
        average_entry_price,
        opened_at,
        closed_at,
        created_at,
        updated_at
      FROM positions
      WHERE status = 'OPEN'
      ORDER BY id ASC
    `).all();
  }

  create({
    symbol,
    quantity,
    investedAmount,
    averageEntryPrice,
  }) {
    const now = new Date().toISOString();

    const result = this.prepare(`
      INSERT INTO positions (
        symbol,
        status,
        quantity,
        invested_amount,
        average_entry_price,
        opened_at,
        created_at,
        updated_at
      )
      VALUES (?, 'OPEN', ?, ?, ?, ?, ?, ?)
    `).run(
      symbol,
      quantity,
      investedAmount,
      averageEntryPrice,
      now,
      now,
      now
    );

    return this.getById(result.lastInsertRowid);
  }

  addInvestment(
    id,
    {
      quantity,
      investedAmount,
      averageEntryPrice,
    }
  ) {
    const now = new Date().toISOString();

    this.prepare(`
      UPDATE positions
      SET
        quantity = ?,
        invested_amount = ?,
        average_entry_price = ?,
        updated_at = ?
      WHERE id = ?
        AND status = 'OPEN'
    `).run(
      quantity,
      investedAmount,
      averageEntryPrice,
      now,
      id
    );

    return this.getById(id);
  }

  close(id) {
    const now = new Date().toISOString();

    this.prepare(`
      UPDATE positions
      SET
        status = 'CLOSED',
        closed_at = ?,
        updated_at = ?
      WHERE id = ?
        AND status = 'OPEN'
    `).run(
      now,
      now,
      id
    );

    return this.getById(id);
  }
}
