import { BaseRepository } from '../database/repositories/BaseRepository.js';

export class OrderRequestRepository extends BaseRepository {
  getByKey(requestKey) {
    return this.prepare(`
      SELECT *
      FROM order_requests
      WHERE request_key = ?
    `).get(requestKey) ?? null;
  }

  create({
    requestKey,
    symbol,
    side,
    type,
    quantity,
    price = null,
  }) {
    const now = new Date().toISOString();

    const result = this.prepare(`
      INSERT INTO order_requests (
        request_key,
        symbol,
        side,
        type,
        quantity,
        price,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'PROCESSING', ?, ?)
    `).run(
      requestKey,
      symbol,
      side,
      type,
      quantity,
      price,
      now,
      now
    );

    return this.getById(result.lastInsertRowid);
  }

  getById(id) {
    return this.prepare(`
      SELECT *
      FROM order_requests
      WHERE id = ?
    `).get(id) ?? null;
  }

  markCompleted(id, exchangeOrderId = null) {
    const now = new Date().toISOString();

    this.prepare(`
      UPDATE order_requests
      SET
        status = 'COMPLETED',
        exchange_order_id = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      exchangeOrderId,
      now,
      id
    );

    return this.getById(id);
  }

  markFailed(id) {
    const now = new Date().toISOString();

    this.prepare(`
      UPDATE order_requests
      SET
        status = 'FAILED',
        updated_at = ?
      WHERE id = ?
    `).run(now, id);

    return this.getById(id);
  }
}
