require('dotenv').config({ path: '.env.local' });

(async () => {
  const { getDatabase } =
    await import('../src/server/database/index.js');

  const { BotRuntimeRepository } =
    await import(
      '../src/server/bot/BotRuntimeRepository.js'
    );

  const { PositionRepository } =
    await import(
      '../src/server/position/PositionRepository.js'
    );

  const { OrderRequestRepository } =
    await import(
      '../src/server/order/OrderRequestRepository.js'
    );

  const { RestartRecoveryService } =
    await import(
      '../src/server/recovery/RestartRecoveryService.js'
    );

  const db = getDatabase();

  const botRuntimeRepository =
    new BotRuntimeRepository(db);

  const positionRepository =
    new PositionRepository(db);

  const orderRequestRepository =
    new OrderRequestRepository(db);

  botRuntimeRepository.setState('RUNNING');

  const recovery =
    new RestartRecoveryService({
      botRuntimeRepository,
      positionRepository,
      orderRequestRepository,
    });

  const result = recovery.recover();

  if (result.state !== 'RUNNING') {
    throw new Error(
      `Runtime state recovery failed: ${result.state}`
    );
  }

  if (!Array.isArray(result.openPositions)) {
    throw new Error(
      'Open positions recovery failed'
    );
  }

  if (!Array.isArray(result.processingOrders)) {
    throw new Error(
      'Processing orders recovery failed'
    );
  }

  botRuntimeRepository.setState('STOPPED');

  console.log('Runtime state recovery: OK');
  console.log('Open positions recovery: OK');
  console.log('Processing orders recovery: OK');
  console.log('Milestone 35: OK');
})();
