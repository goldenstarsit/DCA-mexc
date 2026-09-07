export class InitialEntryEngine {
  constructor(botConfigService, tradingPairService) {
    this.botConfigService = botConfigService;
    this.tradingPairService = tradingPairService;
  }

  async evaluate({
    symbol,
    currentPrice,
    openPositionCount = 0,
  }) {
    validatePrice(currentPrice);

    if (
      !Number.isInteger(openPositionCount) ||
      openPositionCount < 0
    ) {
      throw new Error(
        'openPositionCount must be a non-negative integer'
      );
    }

    const { config } = this.botConfigService.get();

    if (!config.initialEntryEnabled) {
      return denied('INITIAL_ENTRY_DISABLED');
    }

    if (
      openPositionCount >= config.maxOpenPositions
    ) {
      return denied('MAX_OPEN_POSITIONS_REACHED');
    }

    const tradingPair = this.tradingPairService.get();

    if (!tradingPair?.symbol) {
      return denied('TRADING_PAIR_NOT_CONFIGURED');
    }

    const normalizedSymbol = String(symbol ?? '')
      .trim()
      .toUpperCase();

    if (
      normalizedSymbol &&
      normalizedSymbol !== tradingPair.symbol
    ) {
      return denied('SYMBOL_MISMATCH');
    }

    const investment = Number(config.maxInvestment);

    return {
      allowed: true,
      reason: 'INITIAL_ENTRY_ALLOWED',
      symbol: tradingPair.symbol,
      price: currentPrice,
      investment,
      quantity: investment / currentPrice,
      maxInvestment: investment,
    };
  }
}

function denied(reason) {
  return {
    allowed: false,
    reason,
  };
}

function validatePrice(value) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      'currentPrice must be a positive number'
    );
  }
}
