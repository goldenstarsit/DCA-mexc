(async () => {
  const dotenv = await import('dotenv');
  dotenv.default.config({ path: '.env.local' });

  const { db } =
    await import('../src/server/database/index.js');

  const { MexcClient } =
    await import('../src/server/mexc/MexcClient.js');

  const { MexcSymbolService } =
    await import('../src/server/mexc/services/MexcSymbolService.js');

  const { TradingPairRepository } =
    await import('../src/server/tradingPair/TradingPairRepository.js');

  const { TradingPairService } =
    await import('../src/server/tradingPair/TradingPairService.js');

  const migration = db.prepare(`
    SELECT migration_id
    FROM schema_migrations
    WHERE migration_id = '004_create_trading_pair'
  `).get();

  if (!migration) {
    throw new Error('Migration 004 has not been applied');
  }

  const repository = new TradingPairRepository(db);
  const client = new MexcClient();
  const symbolService = new MexcSymbolService(client);
  const service = new TradingPairService(
    repository,
    symbolService
  );

  repository.delete();

  const saved = await service.set('btcusdt');

  if (saved.symbol !== 'BTCUSDT') {
    throw new Error('Trading pair normalization failed');
  }

  const current = service.get();

  if (current?.symbol !== 'BTCUSDT') {
    throw new Error('Trading pair persistence failed');
  }

  const changed = await service.set('ETHUSDT');

  if (changed.symbol !== 'ETHUSDT') {
    throw new Error('Runtime pair change failed');
  }

  let invalidRejected = false;

  try {
    await service.set('INVALIDPAIR');
  } catch {
    invalidRejected = true;
  }

  if (!invalidRejected) {
    throw new Error('Invalid trading pair was accepted');
  }

  repository.delete();

  console.log('Migration 004: OK');
  console.log('MEXC pair validation: OK');
  console.log('Pair normalization: OK');
  console.log('Pair persistence: OK');
  console.log('Runtime pair change: OK');
  console.log('Invalid pair rejection: OK');

  db.close();
})().catch(error => {
  console.error('TRADING PAIR TEST FAILED:', error);
  process.exit(1);
});
