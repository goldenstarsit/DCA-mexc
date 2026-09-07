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
      this.onclose({
        code: 1000,
        reason: 'test close',
      });
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
        data,
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
  const protobuf = await import('protobufjs');

  const {
    MexcWebSocketClient,
  } = await import(
    '../src/server/mexc/MexcWebSocketClient.js'
  );

  const root = await protobuf.default.load(
    'src/server/mexc/proto/PublicAggreDealsV3Api.proto'
  );

  const Wrapper =
    root.lookupType('PushDataV3ApiWrapper');

  const encoded = Wrapper.encode(
    Wrapper.create({
      channel:
        'spot@public.aggre.deals.v3.api.pb@100ms@BTCUSDT',
      symbol: 'BTCUSDT',
      sendTime: 1700000000000,
      publicAggreDeals: {
        deals: [
          {
            price: '100000',
            quantity: '0.001',
            tradeType: 1,
            time: 1700000000000,
          },
        ],
        eventType:
          'spot@public.aggre.deals.v3.api.pb@100ms',
      },
    })
  ).finish();

  const messages = [];
  const errors = [];

  const client = new MexcWebSocketClient({
    WebSocketImpl: FakeWebSocket,
    pingIntervalMs: 1000000,
    onMessage: message => messages.push(message),
    onError: error => errors.push(error),
  });

  client.connect();

  const socket = FakeWebSocket.instances[0];

  assert.equal(
    socket.url,
    'wss://wbs-api.mexc.com/ws'
  );

  socket.open();

  assert.equal(
    client.isConnected(),
    true
  );

  const tradeChannel =
    client.subscribeTrade('BTCUSDT');

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

  socket.message(encoded);

  await new Promise(resolve =>
    setTimeout(resolve, 100)
  );

  if (errors.length) {
  console.error('WEBSOCKET DECODER ERRORS:');
  for (const error of errors) {
    console.error(error);
  }
}

assert.equal(errors.length, 0);
  assert.equal(messages.length, 1);

  const message = messages[0];

  assert.equal(
    message.channel,
    tradeChannel
  );

  assert.equal(
    message.symbol,
    'BTCUSDT'
  );

  assert.equal(
    message.publicAggreDeals.deals[0].price,
    '100000'
  );

  assert.equal(
    message.publicAggreDeals.deals[0].quantity,
    '0.001'
  );

  assert.equal(
    message.publicAggreDeals.deals[0].tradeType,
    1
  );

  assert.equal(
    message.publicAggreDeals.deals[0].time,
    1700000000000
  );

  client.disconnect();

  console.log('MEXC WebSocket client test: OK');
  console.log('Protobuf encoding/decoding test: OK');
  console.log('Trade price decoding: OK');
  console.log('Trade quantity decoding: OK');
  console.log('Trade type decoding: OK');
  console.log('Trade time decoding: OK');
  console.log('Binary payload handling: OK');
}
main().catch(error => {
  console.error(error);
  process.exit(1);
});
