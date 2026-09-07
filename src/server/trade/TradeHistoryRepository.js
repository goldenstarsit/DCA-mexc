import { BaseRepository } from '../database/repositories/BaseRepository.js';

export class TradeHistoryRepository extends BaseRepository {
  getAll() {
    return this.prepare(`
      SELECT *
      FROM trade_history
      ORDER BY id DESC
    `).all();
  }

  getById(id) {
    return this.prepare(`
      SELECT *
      FROM trade_history
      WHERE id = ?
    `).get(id) ?? null;
  }

  create({
    symbol,
    side = 'SELL',
    quantity,
    price,
    investedAmount = 0,
    realizedPnl = 0,
    realizedPnlPercent = 0,
    entryPrice = null,
    exitPrice = null,
    positionId = null,
    entryOrderId = null,
    exitOrderId = null,
    openedAt = null,
    closedAt,
  }) {
    const createdAt = new Date().toISOString();

    const result = this.prepare(`
      INSERT INTO trade_history (
        symbol,
        side,
        quantity,
        price,
        invested_amount,
        realized_pnl,
        realized_pnl_percent,
        entry_price,
        exit_price,
        position_id,
        entry_order_id,
        exit_order_id,
        opened_at,
        closed_at,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      symbol,
      side,
      quantity,
      price,
      investedAmount,
      realizedPnl,
      realizedPnlPercent,
      entryPrice,
      exitPrice,
      positionId,
      entryOrderId,
      exitOrderId,
      openedAt,
      closedAt,
      createdAt
    );

    return this.getById(result.lastInsertRowid);
  }
}
