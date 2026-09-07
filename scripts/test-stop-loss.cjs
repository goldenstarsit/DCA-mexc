const { spawnSync } = require('node:child_process');

const result = spawnSync(
  'node',
  ['--input-type=module'],
  {
    input: `
      const { db } =
        await import('./src/server/database/index.js');

      const { BotConfigRepository } =
        await import('./src/server/botConfig/BotConfigRepository.js');

      const { BotConfigService } =
        await import('./src/server/botConfig/BotConfigService.js');

      const { StopLossEngine } =
        await import('./src/server/stopLoss/StopLossEngine.js');

      const botConfigService =
        new BotConfigService(
          new BotConfigRepository(db)
        );

      const original =
        botConfigService.get();

      botConfigService.save({
        maxInvestment: 100,
        maxOpenPositions: 1,
        initialEntryEnabled: true,
        takeProfitPercent: 1,
        stopLossPercent: 3,
      });

      const engine =
        new StopLossEngine(botConfigService);

      const notTriggered =
        engine.evaluate({
          averageEntryPrice: 100,
          currentPrice: 98,
        });

      if (notTriggered.triggered) {
        throw new Error(
          'Stop loss triggered too early'
        );
      }

      if (
        Math.abs(
          notTriggered.lossPercent - 2
        ) > 1e-9
      ) {
        throw new Error(
          'Loss percentage calculation failed'
        );
      }

      if (
        Math.abs(
          notTriggered.stopPrice - 97
        ) > 1e-9
      ) {
        throw new Error(
          'Stop price calculation failed'
        );
      }

      console.log('SL below threshold: OK');

      const triggered =
        engine.evaluate({
          averageEntryPrice: 100,
          currentPrice: 97,
        });

      if (!triggered.triggered) {
        throw new Error(
          'Stop loss did not trigger'
        );
      }

      if (
        triggered.reason !==
        'STOP_LOSS_TRIGGERED'
      ) {
        throw new Error(
          'Stop loss trigger reason failed'
        );
      }

      console.log('SL trigger: OK');

      botConfigService.save(original.config);

      db.close();

      console.log('Milestone 21: OK');
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
