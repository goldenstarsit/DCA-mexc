(async () => {
  const dotenv = await import('dotenv');
  dotenv.default.config({ path: '.env.local' });

  const { db } =
    await import('../src/server/database/index.js');

  const { DcaLevelRepository } =
    await import('../src/server/dca/DcaLevelRepository.js');

  const { DcaLevelService } =
    await import('../src/server/dca/DcaLevelService.js');

  const { DcaStrategyEngine } =
    await import('../src/server/dca/DcaStrategyEngine.js');

  const repository =
    new DcaLevelRepository(db);

  const levelService =
    new DcaLevelService(repository);

  const engine =
    new DcaStrategyEngine(levelService);

  repository.deleteAll();

  levelService.create({
    level: 1,
    triggerPercent: 2,
    quantity: 10,
  });

  levelService.create({
    level: 2,
    triggerPercent: 4,
    quantity: 20,
  });

  levelService.create({
    level: 3,
    triggerPercent: 6,
    quantity: 30,
  });

  let result = engine.evaluate({
    entryPrice: 100,
    currentPrice: 99,
  });

  if (result.triggered) {
    throw new Error(
      'DCA triggered before threshold'
    );
  }

  result = engine.evaluate({
    entryPrice: 100,
    currentPrice: 98,
  });

  if (
    !result.triggered ||
    result.level.level !== 1
  ) {
    throw new Error(
      'Level 1 trigger failed'
    );
  }

  result = engine.evaluate({
    entryPrice: 100,
    currentPrice: 96,
  });

  if (
    !result.triggered ||
    result.level.level !== 2
  ) {
    throw new Error(
      'Level 2 trigger failed'
    );
  }

  result = engine.evaluate({
    entryPrice: 100,
    currentPrice: 94,
  });

  if (
    !result.triggered ||
    result.level.level !== 3
  ) {
    throw new Error(
      'Level 3 trigger failed'
    );
  }

  result = engine.evaluate({
    entryPrice: 100,
    currentPrice: 96,
    lastTriggeredLevel: 2,
  });

  if (
    result.triggered ||
    result.reason !== 'NO_DCA_LEVEL_TRIGGERED'
  ) {
    throw new Error(
      'Previously triggered levels were not skipped'
    );
  }

  result = engine.evaluate({
    entryPrice: 100,
    currentPrice: 94,
    lastTriggeredLevel: 2,
  });

  if (
    !result.triggered ||
    result.level.level !== 3
  ) {
    throw new Error(
      'Next DCA level trigger failed'
    );
  }

  result = engine.evaluate({
    entryPrice: 100,
    currentPrice: 102,
  });

  if (
    result.triggered ||
    result.reason !== 'PRICE_NOT_BELOW_ENTRY'
  ) {
    throw new Error(
      'Price-above-entry handling failed'
    );
  }

  repository.update(2, {
    triggerPercent: 4,
    quantity: 20,
    enabled: false,
  });

  result = engine.evaluate({
    entryPrice: 100,
    currentPrice: 96,
    lastTriggeredLevel: 1,
  });

  if (
    result.triggered ||
    result.reason !== 'NO_DCA_LEVEL_TRIGGERED'
  ) {
    throw new Error(
      'Disabled DCA level was incorrectly triggered'
    );
  }

  result = engine.evaluate({
    entryPrice: 100,
    currentPrice: 94,
    lastTriggeredLevel: 1,
  });

  if (
    !result.triggered ||
    result.level.level !== 3
  ) {
    throw new Error(
      'Disabled level caused incorrect selection'
    );
  }

  let invalidRejected = false;

  try {
    engine.evaluate({
      entryPrice: 0,
      currentPrice: 100,
    });
  } catch {
    invalidRejected = true;
  }

  if (!invalidRejected) {
    throw new Error(
      'Invalid entry price was accepted'
    );
  }

  repository.deleteAll();

  console.log('DCA Strategy Engine: OK');
  console.log('Level 1 trigger: OK');
  console.log('Level 2 trigger: OK');
  console.log('Level 3 trigger: OK');
  console.log('Triggered-level protection: OK');
  console.log('Price direction handling: OK');
  console.log('Disabled level handling: OK');
  console.log('Input validation: OK');

  db.close();
})().catch(error => {
  console.error(
    'DCA STRATEGY TEST FAILED:',
    error
  );
  process.exit(1);
});
