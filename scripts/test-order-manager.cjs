const assert = require('node:assert/strict');

async function main() {
  const { OrderManager } =
    await import('../src/server/order/OrderManager.js');

  const calls = [];

  const fakeClient = {
    async order(params) {
      calls.push(params);

      return {
        orderId: 'TEST-ORDER-001',
        status: 'NEW',
      };
    },
  };

  const manager = new OrderManager(fakeClient);

  const marketOrder = await manager.place({
    symbol: 'btcusdt',
    side: 'buy',
    type: 'market',
    quantity: 0.001,
  });

  assert.equal(marketOrder.symbol, 'BTCUSDT');
  assert.equal(marketOrder.side, 'BUY');
  assert.equal(marketOrder.type, 'MARKET');
  assert.equal(marketOrder.quantity, 0.001);

  assert.deepEqual(calls[0], {
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'MARKET',
    quantity: 0.001,
  });

  console.log('Market order validation: OK');

  const limitOrder = await manager.place({
    symbol: 'BTCUSDT',
    side: 'SELL',
    type: 'LIMIT',
    quantity: 0.002,
    price: 100000,
  });

  assert.equal(limitOrder.type, 'LIMIT');
  assert.equal(limitOrder.price, 100000);

  assert.deepEqual(calls[1], {
    symbol: 'BTCUSDT',
    side: 'SELL',
    type: 'LIMIT',
    quantity: 0.002,
    price: 100000,
    timeInForce: 'GTC',
  });

  console.log('Limit order validation: OK');

  await assert.rejects(
    () =>
      manager.place({
        symbol: 'BTCUSDT',
        side: 'BUY',
        quantity: 0,
      }),
    /quantity must be a positive number/
  );

  console.log('Quantity validation: OK');

  await assert.rejects(
    () =>
      manager.place({
        symbol: 'BTCUSDT',
        side: 'INVALID',
        quantity: 0.001,
      }),
    /side must be one of/
  );

  console.log('Side validation: OK');

  await assert.rejects(
    () =>
      manager.place({
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'LIMIT',
        quantity: 0.001,
      }),
    /price must be a positive number/
  );

  console.log('Limit price validation: OK');

  console.log('Milestone 22: OK');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
