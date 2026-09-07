export class TradingPairService {
  constructor(repository, symbolService) {
    this.repository = repository;
    this.symbolService = symbolService;
  }

  get() {
    return this.repository.get();
  }

  async set(symbol) {
    const normalized = String(symbol ?? '')
      .trim()
      .toUpperCase();

    if (!normalized) {
      throw new Error('Trading pair is required');
    }

    const symbolInfo =
      await this.symbolService.getSymbolInfo(normalized);

    if (!symbolInfo) {
      throw new Error(
        `MEXC trading pair not found: ${normalized}`
      );
    }

    if (
      symbolInfo.isSpotTradingAllowed === false
    ) {
      throw new Error(
        `Spot trading is not allowed: ${normalized}`
      );
    }

    return this.repository.save(normalized);
  }
}
