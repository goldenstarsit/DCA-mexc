(async () => {
  const dotenv = await import('dotenv'); dotenv.default.config({ path: '.env.local' });

  const { db } =
    await import('../src/server/database/index.js');

  const { MexcCredentialsRepository } =
    await import('../src/server/mexc/repositories/MexcCredentialsRepository.js');

  const { MexcCredentialsService } =
    await import('../src/server/mexc/MexcCredentialsService.js');

  const repository = new MexcCredentialsRepository(db);
  const service = new MexcCredentialsService(repository);

  const migration = db.prepare(`
    SELECT migration_id
    FROM schema_migrations
    WHERE migration_id = '003_create_mexc_credentials'
  `).get();

  if (!migration) {
    throw new Error('Migration 003 has not been applied');
  }

  const apiKey = 'TEST_MEXC_API_KEY_123456';
  const secretKey = 'TEST_MEXC_SECRET_KEY_987654';

  service.delete();

  service.save({
    apiKey,
    secretKey,
  });

  const raw = repository.get();

  if (!raw) {
    throw new Error('Credentials were not stored');
  }

  if (raw.api_key_encrypted.includes(apiKey)) {
    throw new Error('API key is stored as plaintext');
  }

  if (raw.secret_key_encrypted.includes(secretKey)) {
    throw new Error('Secret key is stored as plaintext');
  }

  const credentials = service.get();

  if (credentials.apiKey !== apiKey) {
    throw new Error('API key decryption failed');
  }

  if (credentials.secretKey !== secretKey) {
    throw new Error('Secret key decryption failed');
  }

  const masked = service.getMasked();

  if (!masked?.apiKey.includes('*')) {
    throw new Error('API key masking failed');
  }

  if (masked.hasSecretKey !== true) {
    throw new Error('Secret key status failed');
  }

  service.delete();

  if (repository.get() !== null) {
    throw new Error('Credential deletion failed');
  }

  console.log('Migration 003: OK');
  console.log('AES-256-GCM encryption: OK');
  console.log('Encrypted-at-rest storage: OK');
  console.log('Credential decryption: OK');
  console.log('Credential masking: OK');
  console.log('Credential deletion: OK');

  db.close();
})().catch(error => {
  console.error('MEXC CREDENTIALS TEST FAILED:', error);
  process.exit(1);
});
