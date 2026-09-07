(async () => {
  await import('dotenv/config');

  const { MexcClient } =
    await import('../src/server/mexc/MexcClient.js');

  const { MexcSymbolService } =
    await import('../src/server/mexc/services/MexcSymbolService.js');

  const client = new MexcClient();
  const service = new MexcSymbolService(client);

  const info = await service.getSymbolInfo('BTCUSDT');

  if (!info) {
    throw new Error('BTCUSDT symbol information not found');
  }

  if (!info.symbol) {
    throw new Error('Symbol missing');
  }

  if (!info.baseAsset) {
    throw new Error('Base asset missing');
  }

  if (!info.quoteAsset) {
    throw new Error('Quote asset missing');
  }

  if (
    info.minQuantity === null &&
    info.stepSize === null
  ) {
    throw new Error(
      'Minimum quantity / step size information missing'
    );
  }

  console.log('MEXC Symbol Information: OK');
  console.log({
    symbol: info.symbol,
    status: info.status,
    baseAsset: info.baseAsset,
    quoteAsset: info.quoteAsset,
    minQuantity: info.minQuantity,
    stepSize: info.stepSize,
    quantityPrecision: info.quantityPrecision,
    pricePrecision: info.pricePrecision,
    minNotional: info.minNotional,
    maxQuantity: info.maxQuantity,
    tickSize: info.tickSize,
  });
})().catch(error => {
  console.error('MEXC SYMBOL TEST FAILED:', error);
  process.exit(1);
});
