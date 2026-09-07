const assert = require('node:assert/strict');

async function main() {
  const { db } =
    await import('../src/server/database/index.js');

  const {
    OrderRequestRepository,
  } =
    await import('../src/server/order/OrderRequestRepository.js');

  const {
    DuplicateOrderProtection,
  } =
    await import('../src/server/order/DuplicateOrderProtection.js');

  const repository =
    new OrderRequestRepository(db);

  const protection =
    new DuplicateOrderProtection(repository);

  const order = {
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'MARKET',
    quantity: 0.001,
  };

  const first =
    protection.reserve(order);

  assert.equal(first.duplicate, false);
  assert.ok(first.requestKey);
  assert.ok(first.record);

  console.log('First order reservation: OK');

  const second =
    protection.reserve(order);

  assert.equal(second.duplicate, true);
  assert.equal(
    second.requestKey,
    first.requestKey
  );
  assert.equal(
    second.record.id,
    first.record.id
  );

  console.log('Duplicate order blocked: OK');

  protection.markCompleted(
    first.record.id,
    'TEST-ORDER-001'
  );

  const saved =
    repository.getByKey(first.requestKey);

  assert.equal(saved.status, 'COMPLETED');
  assert.equal(
    saved.exchange_order_id,
    'TEST-ORDER-001'
  );

  console.log('Completed order persistence: OK');

  db.close();

  console.log('Milestone 23: OK');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
