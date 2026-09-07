const assert = require('node:assert/strict');

async function main() {
  const {
    RiskManager,
  } = await import(
    '../src/server/risk/RiskManager.js'
  );

  const botConfigService = {
    get() {
      return {
        config: {
          maxInvestment: 100,
          maxOpenPositions: 1,
        },
      };
    },
  };

  let positions = [];

  const positionManager = {
    getOpen() {
      return positions;
    },
  };

  const risk =
    new RiskManager(
      botConfigService,
      positionManager
    );

  let result = risk.checkEntry({
    quantity: 0.001,
    price: 50_000,
  });

  assert.equal(result.allowed, true);
  assert.equal(
    result.requestedInvestment,
    50
  );
  assert.equal(
    result.projectedInvestment,
    50
  );

  console.log('Entry within investment limit: OK');

  result = risk.checkEntry({
    quantity: 0.0021,
    price: 50_000,
  });

  assert.equal(result.allowed, false);
  assert.equal(
    result.reason,
    'MAX_INVESTMENT_EXCEEDED'
  );

  console.log('Maximum investment protection: OK');

  positions = [
    {
      id: 1,
      symbol: 'BTCUSDT',
      status: 'OPEN',
      invested_amount: 60,
    },
  ];

  result = risk.checkEntry({
    quantity: 0.0002,
    price: 50_000,
  });

  assert.equal(result.allowed, false);
  assert.equal(
    result.reason,
    'MAX_OPEN_POSITIONS_REACHED'
  );

  console.log('Maximum open positions protection: OK');

  result = risk.checkDca({
    positionId: 1,
    quantity: 0.001,
    price: 50_000,
  });

  assert.equal(result.allowed, false);
  assert.equal(
    result.reason,
    'MAX_INVESTMENT_EXCEEDED'
  );

  console.log('DCA investment protection: OK');

  result = risk.checkDca({
    positionId: 999,
    quantity: 0.001,
    price: 50_000,
  });

  assert.equal(result.allowed, false);
  assert.equal(
    result.reason,
    'POSITION_NOT_FOUND'
  );

  console.log('Invalid position protection: OK');

  result = risk.checkSell({
    quantity: 0.001,
  });

  assert.equal(result.allowed, true);

  console.log('Sell risk check: OK');

  assert.throws(
    () =>
      risk.checkEntry({
        quantity: 0,
        price: 50_000,
      }),
    /quantity must be a positive number/
  );

  console.log('Quantity validation: OK');

  assert.throws(
    () =>
      risk.checkEntry({
        quantity: 0.001,
        price: 0,
      }),
    /price must be a positive number/
  );

  console.log('Price validation: OK');

  console.log('Milestone 25: OK');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
