(async () => {
  const dotenv = await import('dotenv');
  dotenv.default.config({ path: '.env.local' });

  const { db } =
    await import('../src/server/database/index.js');

  const { BotConfigRepository } =
    await import('../src/server/botConfig/BotConfigRepository.js');

  const {
    BotConfigService,
    DEFAULT_CONFIG,
  } = await import('../src/server/botConfig/BotConfigService.js');

  const migration = db.prepare(`
    SELECT migration_id
    FROM schema_migrations
    WHERE migration_id = '005_create_bot_config'
  `).get();

  if (!migration) {
    throw new Error(
      'Migration 005 has not been applied'
    );
  }

  const repository = new BotConfigRepository(db);
  const service = new BotConfigService(repository);

  repository.delete();

  const defaults = service.get();

  if (
    JSON.stringify(defaults.config) !==
    JSON.stringify(DEFAULT_CONFIG)
  ) {
    throw new Error('Default configuration failed');
  }

  const saved = service.save({
    maxInvestment: 250,
    maxOpenPositions: 2,
    initialEntryEnabled: false,
    takeProfitPercent: 1.5,
    stopLossPercent: 4,
  });

  if (saved.config.maxInvestment !== 250) {
    throw new Error('Configuration persistence failed');
  }

  if (saved.config.initialEntryEnabled !== false) {
    throw new Error('Boolean configuration failed');
  }

  const updated = service.update({
    maxInvestment: 500,
  });

  if (
    updated.config.maxInvestment !== 500 ||
    updated.config.maxOpenPositions !== 2
  ) {
    throw new Error('Runtime configuration update failed');
  }

  let invalidRejected = false;

  try {
    service.save({
      maxInvestment: -10,
    });
  } catch {
    invalidRejected = true;
  }

  if (!invalidRejected) {
    throw new Error(
      'Invalid configuration was accepted'
    );
  }

  service.reset();

  const reset = service.get();

  if (
    reset.config.maxInvestment !==
    DEFAULT_CONFIG.maxInvestment
  ) {
    throw new Error('Configuration reset failed');
  }

  repository.delete();

  console.log('Migration 005: OK');
  console.log('Default configuration: OK');
  console.log('Configuration persistence: OK');
  console.log('Runtime configuration update: OK');
  console.log('Configuration validation: OK');
  console.log('Configuration reset: OK');

  db.close();
})().catch(error => {
  console.error(
    'BOT CONFIG TEST FAILED:',
    error
  );
  process.exit(1);
});
