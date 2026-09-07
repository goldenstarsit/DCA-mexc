const assert = require('node:assert/strict');

class FakeWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;

  constructor(url) {
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  send(data) {
    this.sent.push(JSON.parse(data));
  }

  close() {
    this.readyState = 3;

    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'test close' });
    }
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;

    if (this.onopen) {
      this.onopen();
    }
  }

  message(data) {
    if (this.onmessage) {
      this.onmessage({
        data: JSON.stringify(data),
      });
    }
  }

  error(error) {
    if (this.onerror) {
      this.onerror(error);
    }
  }
}

FakeWebSocket.instances = [];

async function main() {
  const {
    MexcWebSocketClient,
  } = await import(
    '../src/server/mexc/MexcWebSocketClient.js'
  );

  const messages = [];
  const errors = [];

  const client = new MexcWebSocketClient({
    WebSocketImpl: FakeWebSocket,
    pingIntervalMs: 1000000,
    onMessage: message => messages.push(message),
    onError: error => errors.push(error),
  });

  client.connect();

  assert.equal(FakeWebSocket.instances.length, 1);

  const socket = FakeWebSocket.instances[0];

  assert.equal(
    socket.url,
    'ws://wbs-api.mexc.com/ws'
  );

  socket.open();

  assert.equal(client.isConnected(), true);

  const tradeChannel =
    client.subscribeTrade('btcusdt');

  assert.equal(
    tradeChannel,
    'spot@public.aggre.deals.v3.api.pb@100ms@BTCUSDT'
  );

  assert.deepEqual(
    socket.sent[0],
    {
      method: 'SUBSCRIPTION',
      params: [tradeChannel],
    }
  );

  const bookChannel =
    client.subscribeBookTicker('ethusdt');

  assert.equal(
    bookChannel,
    'spot@public.aggre.bookTicker.v3.api.pb@100ms@ETHUSDT'
  );

  assert.deepEqual(
    socket.sent[1],
    {
      method: 'SUBSCRIPTION',
      params: [bookChannel],
    }
  );

  client.ping();

  assert.deepEqual(
    socket.sent[2],
    {
      method: 'PING',
    }
  );

  socket.message({
    msg: 'PONG',
  });

  socket.message({
    channel:
      'spot@public.aggre.deals.v3.api.pb@100ms',
    symbol: 'BTCUSDT',
    publicdeals: {
      dealsList: [
        {
          price: '100000',
          quantity: '0.001',
          tradetype: 1,
          time: 1700000000000,
        },
      ],
    },
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].symbol, 'BTCUSDT');
  assert.equal(
    messages[0].publicdeals.dealsList[0].price,
    '100000'
  );

  client.unsubscribe(tradeChannel);

  assert.deepEqual(
    socket.sent[3],
    {
      method: 'UNSUBSCRIPTION',
      params: [tradeChannel],
    }
  );

  assert.equal(errors.length, 0);

  client.disconnect();

  assert.equal(client.isConnected(), false);

  console.log('MEXC WebSocket client test: OK');
  console.log('Trade subscription: OK');
  console.log('Book ticker subscription: OK');
  console.log('PING/PONG handling: OK');
  console.log('Message parsing: OK');
  console.log('Unsubscription: OK');
  console.log('Clean disconnect: OK');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
