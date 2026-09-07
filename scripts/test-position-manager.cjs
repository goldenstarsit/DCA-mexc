require('dotenv').config({ path: '.env.local' });

async function main() {
  const Database = require('better-sqlite3');

  const db = new Database('./data/dca-mexc.db');

  const originalBotConfig = db.prepare(`
    SELECT config_json
    FROM bot_config
    WHERE id = 1
  `).get();

  db.prepare(`
    INSERT INTO bot_config (
      id,
      config_json,
      updated_at
    )
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      config_json = excluded.config_json,
      updated_at = excluded.updated_at
  `).run(
    JSON.stringify({
      maxInvestment: 100,
      maxOpenPositions: 1,
      initialEntryEnabled: true,
      takeProfitPercent: 1,
      stopLossPercent: 3,
    }),
    new Date().toISOString()
  );

  db.close();

  const { db: appDb } =
    await import('../src/server/database/index.js');

  const {
    BotConfigRepository,
  } = await import(
    '../src/server/botConfig/BotConfigRepository.js'
  );

  const {
    BotConfigService,
  } = await import(
    '../src/server/botConfig/BotConfigService.js'
  );

  const {
    PositionRepository,
  } = await import(
    '../src/server/position/PositionRepository.js'
  );

  const {
    PositionManager,
  } = await import(
    '../src/server/position/PositionManager.js'
  );

  const manager = new PositionManager(
    new PositionRepository(appDb),
    new BotConfigService(
      new BotConfigRepository(appDb)
    )
  );

  let position;

  try {
    position = manager.open({
      symbol: 'BTCUSDT',
      quantity: 1,
      price: 100,
    });

    if (
      position.symbol !== 'BTCUSDT' ||
      position.status !== 'OPEN' ||
      Number(position.quantity) !== 1 ||
      Number(position.invested_amount) !== 100 ||
      Number(position.average_entry_price) !== 100
    ) {
      throw new Error('Initial position creation failed');
    }

    console.log('Position creation: OK');
    console.log('Initial average price: OK');

    const afterDca = manager.addToPosition({
      positionId: position.id,
      quantity: 1,
      price: 80,
    });

    if (
      Number(afterDca.quantity) !== 2 ||
      Number(afterDca.invested_amount) !== 180 ||
      Number(afterDca.average_entry_price) !== 90
    ) {
      throw new Error('DCA position update failed');
    }

    console.log('DCA position update: OK');
    console.log('Average entry calculation: OK');

    const openBySymbol =
      manager.getOpenBySymbol('btcusdt');

    if (
      !openBySymbol ||
      openBySymbol.id !== position.id
    ) {
      throw new Error(
        'Open position lookup failed'
      );
    }

    console.log('Open position lookup: OK');

    const duplicateError = (() => {
      try {
        manager.open({
          symbol: 'BTCUSDT',
          quantity: 1,
          price: 90,
        });

        return false;
      } catch (error) {
        return error.message.includes(
          'Open position already exists'
        );
      }
    })();

    if (!duplicateError) {
      throw new Error(
        'Duplicate position protection failed'
      );
    }

    console.log('Duplicate position protection: OK');

    const closed =
      manager.close(position.id);

    if (
      closed.status !== 'CLOSED' ||
      !closed.closed_at
    ) {
      throw new Error(
        'Position close failed'
      );
    }

    console.log('Position close: OK');
    console.log('Milestone 19: OK');
  } finally {
    const cleanupDb =
      new Database('./data/dca-mexc.db');

    if (position?.id) {
      cleanupDb.prepare(`
        DELETE FROM positions
        WHERE id = ?
      `).run(position.id);
    }

    if (originalBotConfig) {
      cleanupDb.prepare(`
        UPDATE bot_config
        SET config_json = ?, updated_at = ?
        WHERE id = 1
      `).run(
        originalBotConfig.config_json,
        new Date().toISOString()
      );
    }

    cleanupDb.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
