(async () => {
  const dotenv = await import('dotenv');
  dotenv.default.config({ path: '.env.local' });

  const { db } =
    await import('../src/server/database/index.js');

  const { DcaLevelRepository } =
    await import('../src/server/dca/DcaLevelRepository.js');

  const { DcaLevelService } =
    await import('../src/server/dca/DcaLevelService.js');

  const migration = db.prepare(`
    SELECT migration_id
    FROM schema_migrations
    WHERE migration_id = '006_create_dca_levels'
  `).get();

  if (!migration) {
    throw new Error(
      'Migration 006 has not been applied'
    );
  }

  const repository =
    new DcaLevelRepository(db);

  const service =
    new DcaLevelService(repository);

  repository.deleteAll();

  const level1 = service.create({
    level: 1,
    triggerPercent: 2,
    quantity: 10,
  });

  if (
    level1.level !== 1 ||
    level1.trigger_percent !== 2 ||
    level1.quantity !== 10 ||
    level1.enabled !== 1
  ) {
    throw new Error(
      'DCA level creation failed'
    );
  }

  const level2 = service.create({
    level: 2,
    triggerPercent: 4,
    quantity: 20,
    enabled: false,
  });

  if (
    level2.level !== 2 ||
    level2.enabled !== 0
  ) {
    throw new Error(
      'DCA level 2 creation failed'
    );
  }

  const all = service.getAll();

  if (
    all.length !== 2 ||
    all[0].level !== 1 ||
    all[1].level !== 2
  ) {
    throw new Error(
      'DCA level ordering failed'
    );
  }

  const updated = service.update(1, {
    triggerPercent: 3,
    quantity: 15,
    enabled: false,
  });

  if (
    updated.trigger_percent !== 3 ||
    updated.quantity !== 15 ||
    updated.enabled !== 0
  ) {
    throw new Error(
      'DCA level update failed'
    );
  }

  let duplicateRejected = false;

  try {
    service.create({
      level: 1,
      triggerPercent: 5,
      quantity: 30,
    });
  } catch {
    duplicateRejected = true;
  }

  if (!duplicateRejected) {
    throw new Error(
      'Duplicate DCA level was accepted'
    );
  }

  let invalidRejected = false;

  try {
    service.create({
      level: 3,
      triggerPercent: -1,
      quantity: 10,
    });
  } catch {
    invalidRejected = true;
  }

  if (!invalidRejected) {
    throw new Error(
      'Invalid trigger was accepted'
    );
  }

  service.delete(2);

  if (service.get(2) !== null) {
    throw new Error(
      'DCA level deletion failed'
    );
  }

  repository.deleteAll();

  console.log('Migration 006: OK');
  console.log('DCA level creation: OK');
  console.log('DCA level ordering: OK');
  console.log('DCA level update: OK');
  console.log('Duplicate level protection: OK');
  console.log('Validation: OK');
  console.log('DCA level deletion: OK');

  db.close();
})().catch(error => {
  console.error(
    'DCA LEVEL TEST FAILED:',
    error
  );
  process.exit(1);
});
