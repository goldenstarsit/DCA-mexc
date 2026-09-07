require('dotenv').config({ path: '.env.local' });

const { createRequire } = require('module');
const requireModule = createRequire(__filename);

const DatabaseDriver = requireModule('better-sqlite3');

const db = new DatabaseDriver(
  process.env.DATABASE_FILE || './data/dca-mexc.db'
);

const repository = requireModule(
  '../src/server/dca/DcaTriggerConfigRepository.js'
);

const serviceModule = requireModule(
  '../src/server/dca/DcaTriggerConfigService.js'
);

const DcaTriggerConfigRepository =
  repository.DcaTriggerConfigRepository;

const DcaTriggerConfigService =
  serviceModule.DcaTriggerConfigService;

const repo = new DcaTriggerConfigRepository({
  prepare: sql => db.prepare(sql),
});

const service = new DcaTriggerConfigService(repo);

service.reset();

let config = service.get();

if (
  config.triggerMode !== 'PRICE_DROP' ||
  config.requirePriceBelowEntry !== true
) {
  throw new Error('Default trigger configuration failed');
}

console.log('Default trigger configuration: OK');

config = service.save({
  triggerMode: 'PRICE_DROP',
  requirePriceBelowEntry: false,
});

if (
  config.triggerMode !== 'PRICE_DROP' ||
  config.requirePriceBelowEntry !== false
) {
  throw new Error('Trigger configuration persistence failed');
}

console.log('Configuration persistence: OK');

config = service.update({
  requirePriceBelowEntry: true,
});

if (config.requirePriceBelowEntry !== true) {
  throw new Error('Runtime configuration update failed');
}

console.log('Runtime configuration update: OK');

try {
  service.save({
    triggerMode: 'INVALID',
    requirePriceBelowEntry: true,
  });

  throw new Error('Invalid trigger mode was accepted');
} catch (error) {
  if (
    error.message ===
    'Invalid trigger mode was accepted'
  ) {
    throw error;
  }
}

console.log('Configuration validation: OK');

service.reset();

config = service.get();

if (
  config.triggerMode !== 'PRICE_DROP' ||
  config.requirePriceBelowEntry !== true
) {
  throw new Error('Configuration reset failed');
}

console.log('Configuration reset: OK');

db.close();

console.log('DCA Trigger Configuration: OK');
