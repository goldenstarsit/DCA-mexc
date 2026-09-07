import { BaseRepository } from '../database/repositories/BaseRepository.js';

export class DcaLevelRepository extends BaseRepository {
  getAll() {
    return this.prepare(`
      SELECT
        id,
        level,
        trigger_percent,
        quantity,
        enabled,
        created_at,
        updated_at
      FROM dca_levels
      ORDER BY level ASC
    `).all();
  }

  getByLevel(level) {
    return this.prepare(`
      SELECT
        id,
        level,
        trigger_percent,
        quantity,
        enabled,
        created_at,
        updated_at
      FROM dca_levels
      WHERE level = ?
    `).get(level) ?? null;
  }

  create({
    level,
    triggerPercent,
    quantity,
    enabled = true,
  }) {
    const now = new Date().toISOString();

    this.prepare(`
      INSERT INTO dca_levels (
        level,
        trigger_percent,
        quantity,
        enabled,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      level,
      triggerPercent,
      quantity,
      enabled ? 1 : 0,
      now,
      now
    );

    return this.getByLevel(level);
  }

  update(
    level,
    {
      triggerPercent,
      quantity,
      enabled,
    }
  ) {
    const current = this.getByLevel(level);

    if (!current) {
      throw new Error(`DCA level not found: ${level}`);
    }

    const now = new Date().toISOString();

    this.prepare(`
      UPDATE dca_levels
      SET
        trigger_percent = ?,
        quantity = ?,
        enabled = ?,
        updated_at = ?
      WHERE level = ?
    `).run(
      triggerPercent,
      quantity,
      enabled ? 1 : 0,
      now,
      level
    );

    return this.getByLevel(level);
  }

  delete(level) {
    return this.prepare(`
      DELETE FROM dca_levels
      WHERE level = ?
    `).run(level);
  }

  reorder(levels) {
    const transaction = this.db.transaction((orderedLevels) => {
      const now = new Date().toISOString();

      for (let index = 0; index < orderedLevels.length; index++) {
        const level = orderedLevels[index];
        const temporaryLevel = -(index + 1);

        this.prepare(`
          UPDATE dca_levels
          SET level = ?, updated_at = ?
          WHERE level = ?
        `).run(
          temporaryLevel,
          now,
          level
        );
      }

      for (let index = 0; index < orderedLevels.length; index++) {
        const oldLevel = -(index + 1);
        const newLevel = index + 1;

        this.prepare(`
          UPDATE dca_levels
          SET level = ?, updated_at = ?
          WHERE level = ?
        `).run(
          newLevel,
          now,
          oldLevel
        );
      }

      return this.getAll();
    });

    return transaction(levels);
  }

  deleteAll() {
    return this.prepare(`
      DELETE FROM dca_levels
    `).run();
  }
}
