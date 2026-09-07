require('dotenv').config({
  path: '.env.local'
});

const { createRequire } = require('module');
const requireModule = createRequire(__filename);

const DatabaseDriver =
  requireModule('better-sqlite3');

const repositoryModule = requireModule(
  '../src/server/dca/DcaQuantityConfigRepository.js'
);

const serviceModule = requireModule(
  '../src/server/dca/DcaQuantityConfigService.js'
);

const db = new DatabaseDriver(
  process.env.DATABASE_FILE ||
  './data/dca-mexc.db'
);

const repository =
  new repositoryModule.DcaQuantityConfigRepository({
    prepare: sql => db.prepare(sql),
  });

const service =
  new serviceModule.DcaQuantityConfigService(
    repository
  );

service.reset();

let config = service.get();

if (config.quantityMode !== 'FIXED') {
  throw new Error(
    'Default quantity configuration failed'
  );
}

console.log(
  'Default quantity configuration: OK'
);

config = service.save({
  quantityMode: 'FIXED',
});

if (config.quantityMode !== 'FIXED') {
  throw new Error(
    'Quantity configuration persistence failed'
  );
}

console.log(
  'Configuration persistence: OK'
);

service.update({
  quantityMode: 'FIXED',
});

console.log(
  'Runtime configuration update: OK'
);

const symbolInfo = {
  minQuantity: '0.001',
  stepSize: '0.001',
};

if (
  service.validateQuantity(
    0.005,
    symbolInfo
  ) !== true
) {
  throw new Error(
    'Valid quantity was rejected'
  );
}

console.log(
  'Minimum quantity validation: OK'
);

try {
  service.validateQuantity(
    0.0001,
    symbolInfo
  );

  throw new Error(
    'Quantity below minimum was accepted'
  );
} catch (error) {
  if (
    error.message ===
    'Quantity below minimum was accepted'
  ) {
    throw error;
  }
}

console.log(
  'Minimum quantity rejection: OK'
);

try {
  service.validateQuantity(
    0.0055,
    symbolInfo
  );

  throw new Error(
    'Invalid step quantity was accepted'
  );
} catch (error) {
  if (
    error.message ===
    'Invalid step quantity was accepted'
  ) {
    throw error;
  }
}

console.log(
  'Step-size validation: OK'
);

try {
  service.validateQuantity(
    0,
    symbolInfo
  );

  throw new Error(
    'Zero quantity was accepted'
  );
} catch (error) {
  if (
    error.message ===
    'Zero quantity was accepted'
  ) {
    throw error;
  }
}

console.log(
  'Positive quantity validation: OK'
);

service.reset();

db.close();

console.log(
  'DCA Quantity Configuration: OK'
);
