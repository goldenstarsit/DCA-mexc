export class MexcSymbolService {
  constructor(mexcClient) {
    this.mexcClient = mexcClient;
  }

  async getExchangeInfo() {
    return this.mexcClient.exchangeInfo();
  }

  async getSymbol(symbol) {
    const info = await this.getExchangeInfo();
    const requested = String(symbol).toUpperCase();

    let symbols = info?.symbols ?? [];

    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }

    return (
      symbols.find(
        item =>
          String(item?.symbol ?? '').toUpperCase() ===
          requested
      ) ?? null
    );
  }

  async getSymbolInfo(symbol) {
    const item = await this.getSymbol(symbol);

    if (!item) {
      return null;
    }

    const filters = Array.isArray(item.filters)
      ? item.filters
      : [];

    const lotSize = filters.find(filter =>
      ['LOT_SIZE', 'MARKET_LOT_SIZE'].includes(
        String(filter?.filterType ?? '').toUpperCase()
      )
    );

    const priceFilter = filters.find(filter =>
      String(filter?.filterType ?? '').toUpperCase() ===
      'PRICE_FILTER'
    );

    const notionalFilter = filters.find(filter =>
      ['MIN_NOTIONAL', 'NOTIONAL'].includes(
        String(filter?.filterType ?? '').toUpperCase()
      )
    );

    const minQuantity =
      item.baseSizePrecision ??
      lotSize?.minQty ??
      null;

    const minNotional =
      item.quoteAmountPrecision ??
      notionalFilter?.minNotional ??
      null;

    const stepSize =
      lotSize?.stepSize ??
      item.baseSizePrecision ??
      null;

    return {
      symbol: item.symbol ?? null,
      status: item.status ?? null,

      baseAsset: item.baseAsset ?? null,
      quoteAsset: item.quoteAsset ?? null,

      minQuantity,
      stepSize,

      quantityPrecision:
        item.baseAssetPrecision ?? null,

      pricePrecision:
        item.quotePrecision ?? null,

      minNotional,

      maxQuantity:
        lotSize?.maxQty ?? null,

      tickSize:
        priceFilter?.tickSize ?? null,

      quoteAmountPrecision:
        item.quoteAmountPrecision ?? null,

      quoteAmountPrecisionMarket:
        item.quoteAmountPrecisionMarket ?? null,

      maxQuoteAmount:
        item.maxQuoteAmount ?? null,

      maxQuoteAmountMarket:
        item.maxQuoteAmountMarket ?? null,

      isSpotTradingAllowed:
        item.isSpotTradingAllowed ?? false,

      quoteOrderQtyMarketAllowed:
        item.quoteOrderQtyMarketAllowed ?? false,

      orderTypes:
        Array.isArray(item.orderTypes)
          ? item.orderTypes
          : [],

      tradeSideType:
        item.tradeSideType ?? null,

      raw: item,
    };
  }
}
