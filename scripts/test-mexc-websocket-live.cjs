(async () => {
  const { MexcWebSocketClient } =
    await import('../src/server/mexc/MexcWebSocketClient.js');

  const symbol = 'BTCUSDT';

  const client = new MexcWebSocketClient({
    reconnectDelay: 3000,
    pingInterval: 20000,
  });

  let receivedBinary = false;
  let receivedTrade = false;

  client.handlers.message = message => {
    console.log('MEXC WS MESSAGE:');

    if (message?.channel) {
      console.log('CHANNEL:', message.channel);
    }

    if (message?.symbol) {
      console.log('SYMBOL:', message.symbol);
    }

    const deals = message?.publicAggreDeals?.deals;

    if (Array.isArray(deals) && deals.length > 0) {
      receivedBinary = true;

      for (const deal of deals) {
        console.log('TRADE:');
        console.log('  PRICE:', deal.price);
        console.log('  QUANTITY:', deal.quantity);
        console.log('  TRADE TYPE:', deal.tradeType);
        console.log('  TIME:', deal.time);
      }

      receivedTrade = true;
    }
  };

  client.handlers.error = error => {
    console.error('MEXC WS ERROR:', error);
  };

  console.log('Connecting to MEXC...');

  await client.connect();

  console.log('Connected');
  console.log(`Subscribing to ${symbol} trade stream...`);

  client.subscribeTrade(symbol);

  const started = Date.now();

  while (Date.now() - started < 15000) {
    if (receivedTrade) {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 250));
  }

  client.disconnect();

  if (!receivedBinary) {
    console.error(
      'LIVE TEST FAILED: No binary protobuf trade data received'
    );
    process.exit(1);
  }

  if (!receivedTrade) {
    console.error(
      'LIVE TEST FAILED: No decoded trade received'
    );
    process.exit(1);
  }

  console.log('');
  console.log('MEXC WS LIVE PROTOBUF: OK');
  console.log('Binary trade payload: OK');
  console.log('Trade protobuf decoding: OK');
  console.log('Live trade price: OK');
  console.log('Live trade quantity: OK');
})();
