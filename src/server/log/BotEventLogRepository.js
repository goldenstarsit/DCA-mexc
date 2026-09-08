import { BaseRepository } from '../database/repositories/BaseRepository.js';

export class BotEventLogRepository extends BaseRepository {
  getAll() {
    return this.prepare(`
      SELECT
        id,
        event_type,
        level,
        message,
        symbol,
        details,
        created_at
      FROM bot_event_logs
      ORDER BY id DESC
      LIMIT 100
    `).all();
  }

  getById(id) {
    return this.prepare(`
      SELECT *
      FROM bot_event_logs
      WHERE id = ?
    `).get(id) ?? null;
  }

  create({
    eventType,
    level = 'INFO',
    message,
    symbol = null,
    details = null,
  }) {
    const createdAt = new Date().toISOString();

    const serializedDetails =
      details == null
        ? null
        : typeof details === 'string'
          ? details
          : JSON.stringify(details);

    const result = this.prepare(`
      INSERT INTO bot_event_logs (
        event_type,
        level,
        message,
        symbol,
        details,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      eventType,
      level,
      message,
      symbol,
      serializedDetails,
      createdAt
    );

    return this.getById(result.lastInsertRowid);
  }
}
