require('dotenv').config({ path: '.env.local' });

const Database = require('better-sqlite3');

async function main() {
  const db = new Database('./data/dca-mexc.db');

  try {
    const botConfig = db.prepare(`
      SELECT config_json
      FROM bot_config
      WHERE id = 1
    `).get();

    const tradingPair = db.prepare(`
      SELECT symbol
      FROM trading_pair_config
      WHERE id = 1
    `).get();

    const originalBotConfig = botConfig
      ? JSON.parse(botConfig.config_json)
      : null;

    const originalPair = tradingPair?.symbol ?? null;

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

    db.prepare(`
      INSERT INTO trading_pair_config (
        id,
        symbol,
        updated_at
      )
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        symbol = excluded.symbol,
        updated_at = excluded.updated_at
    `).run(
      'BTCUSDT',
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
      TradingPairRepository,
    } = await import(
      '../src/server/tradingPair/TradingPairRepository.js'
    );

    const {
      TradingPairService,
    } = await import(
      '../src/server/tradingPair/TradingPairService.js'
    );

    const {
      InitialEntryEngine,
    } = await import(
      '../src/server/entry/InitialEntryEngine.js'
    );

    const engine = new InitialEntryEngine(
      new BotConfigService(
        new BotConfigRepository(appDb)
      ),
      new TradingPairService(
        new TradingPairRepository(appDb),
        {}
      )
    );

    const allowed = await engine.evaluate({
      symbol: 'BTCUSDT',
      currentPrice: 100,
      openPositionCount: 0,
    });

    if (
      !allowed.allowed ||
      allowed.reason !== 'INITIAL_ENTRY_ALLOWED' ||
      allowed.symbol !== 'BTCUSDT' ||
      allowed.investment !== 100 ||
      allowed.quantity !== 1
    ) {
      throw new Error('Initial entry allow decision failed');
    }

    console.log('Initial entry allowed: OK');
    console.log('Investment calculation: OK');
    console.log('Quantity calculation: OK');

    const maxPositions = await engine.evaluate({
      symbol: 'BTCUSDT',
      currentPrice: 100,
      openPositionCount: 1,
    });

    if (
      maxPositions.allowed ||
      maxPositions.reason !== 'MAX_OPEN_POSITIONS_REACHED'
    ) {
      throw new Error('Max position protection failed');
    }

    console.log('Max position protection: OK');

    const disabledDb = new Database('./data/dca-mexc.db');

    disabledDb.prepare(`
      UPDATE bot_config
      SET config_json = ?, updated_at = ?
      WHERE id = 1
    `).run(
      JSON.stringify({
        maxInvestment: 100,
        maxOpenPositions: 1,
        initialEntryEnabled: false,
        takeProfitPercent: 1,
        stopLossPercent: 3,
      }),
      new Date().toISOString()
    );

    disabledDb.close();

    const disabled = await engine.evaluate({
      symbol: 'BTCUSDT',
      currentPrice: 100,
      openPositionCount: 0,
    });

    if (
      disabled.allowed ||
      disabled.reason !== 'INITIAL_ENTRY_DISABLED'
    ) {
      throw new Error('Initial entry disable protection failed');
    }

    console.log('Initial entry disabled protection: OK');
    console.log('Milestone 18: OK');

    const restoreDb = new Database('./data/dca-mexc.db');

    if (originalBotConfig) {
      restoreDb.prepare(`
        UPDATE bot_config
        SET config_json = ?, updated_at = ?
        WHERE id = 1
      `).run(
        JSON.stringify(originalBotConfig),
        new Date().toISOString()
      );
    } else {
      restoreDb.prepare(`
        DELETE FROM bot_config
        WHERE id = 1
      `).run();
    }

    if (originalPair) {
      restoreDb.prepare(`
        UPDATE trading_pair_config
        SET symbol = ?, updated_at = ?
        WHERE id = 1
      `).run(
        originalPair,
        new Date().toISOString()
      );
    } else {
      restoreDb.prepare(`
        DELETE FROM trading_pair_config
        WHERE id = 1
      `).run();
    }

    restoreDb.close();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
