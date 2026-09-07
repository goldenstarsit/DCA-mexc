const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const result = spawnSync(
  'node',
  ['--input-type=module'],
  {
    input: `
      const { db } = await import('./src/server/database/index.js');
      const { BotConfigRepository } = await import('./src/server/botConfig/BotConfigRepository.js');
      const { BotConfigService } = await import('./src/server/botConfig/BotConfigService.js');
      const { TakeProfitEngine } = await import('./src/server/takeProfit/TakeProfitEngine.js');

      const botConfigService =
        new BotConfigService(
          new BotConfigRepository(db)
        );

      const original = botConfigService.get();

      botConfigService.save({
        maxInvestment: 100,
        maxOpenPositions: 1,
        initialEntryEnabled: true,
        takeProfitPercent: 1,
        stopLossPercent: 3,
      });

      const engine =
        new TakeProfitEngine(botConfigService);

      const notTriggered =
        engine.evaluate({
          averageEntryPrice: 100,
          currentPrice: 100.5,
        });

      if (notTriggered.triggered) {
        throw new Error('TP triggered too early');
      }

      if (Math.abs(notTriggered.profitPercent - 0.5) > 1e-9) {
        throw new Error('Profit percentage calculation failed');
      }

      if (Math.abs(notTriggered.targetPrice - 101) > 1e-9) {
        throw new Error('Target price calculation failed');
      }

      console.log('TP below target: OK');

      const triggered =
        engine.evaluate({
          averageEntryPrice: 100,
          currentPrice: 101,
        });

      if (!triggered.triggered) {
        throw new Error('TP did not trigger');
      }

      if (triggered.reason !== 'TAKE_PROFIT_TRIGGERED') {
        throw new Error('TP trigger reason failed');
      }

      console.log('TP trigger: OK');

      botConfigService.save(original.config);
      db.close();

      console.log('Milestone 20: OK');
    `,
  },
  {
    cwd: process.cwd(),
    encoding: 'utf8',
  }
);

process.stdout.write(result.stdout);
process.stderr.write(result.stderr);

if (result.status !== 0) {
  process.exit(result.status || 1);
}
