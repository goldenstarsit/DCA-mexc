import { BaseRepository } from '../../database/repositories/BaseRepository.js';

export class MexcCredentialsRepository extends BaseRepository {
  get() {
    return this.prepare(`
      SELECT
        id,
        api_key_encrypted,
        secret_key_encrypted,
        created_at,
        updated_at
      FROM mexc_credentials
      WHERE id = 1
    `).get() ?? null;
  }

  save({
    apiKeyEncrypted,
    secretKeyEncrypted,
  }) {
    const now = new Date().toISOString();

    this.prepare(`
      INSERT INTO mexc_credentials (
        id,
        api_key_encrypted,
        secret_key_encrypted,
        created_at,
        updated_at
      )
      VALUES (1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        api_key_encrypted = excluded.api_key_encrypted,
        secret_key_encrypted = excluded.secret_key_encrypted,
        updated_at = excluded.updated_at
    `).run(
      apiKeyEncrypted,
      secretKeyEncrypted,
      now,
      now
    );

    return this.get();
  }

  delete() {
    return this.prepare(`
      DELETE FROM mexc_credentials
      WHERE id = 1
    `).run();
  }
}
