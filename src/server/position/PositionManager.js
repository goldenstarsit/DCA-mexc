export class PositionManager {
  constructor(repository, botConfigService) {
    this.repository = repository;
    this.botConfigService = botConfigService;
  }

  getOpen() {
    return this.repository.getOpen();
  }

  getOpenBySymbol(symbol) {
    const normalizedSymbol = normalizeSymbol(symbol);

    return this.repository.getOpenBySymbol(
      normalizedSymbol
    );
  }

  open({
    symbol,
    quantity,
    price,
    investedAmount,
  }) {
    const normalizedSymbol = normalizeSymbol(symbol);

    validatePositive(quantity, 'quantity');
    validatePositive(price, 'price');

    const calculatedInvestment =
      investedAmount ?? quantity * price;

    validatePositive(
      calculatedInvestment,
      'investedAmount'
    );

    if (this.repository.getOpenBySymbol(normalizedSymbol)) {
      throw new Error(
        `Open position already exists: ${normalizedSymbol}`
      );
    }

    const config = this.botConfigService.get().config;

    const openPositions =
      this.repository.getOpen().length;

    if (
      openPositions >= config.maxOpenPositions
    ) {
      throw new Error(
        'Maximum open positions reached'
      );
    }

    return this.repository.create({
      symbol: normalizedSymbol,
      quantity,
      investedAmount: calculatedInvestment,
      averageEntryPrice:
        calculatedInvestment / quantity,
    });
  }

  addToPosition({
    positionId,
    quantity,
    price,
    investedAmount,
  }) {
    validatePositive(quantity, 'quantity');
    validatePositive(price, 'price');

    const position =
      this.repository.getById(positionId);

    if (!position) {
      throw new Error(
        `Position not found: ${positionId}`
      );
    }

    if (position.status !== 'OPEN') {
      throw new Error(
        `Position is not open: ${positionId}`
      );
    }

    const additionalInvestment =
      investedAmount ?? quantity * price;

    validatePositive(
      additionalInvestment,
      'investedAmount'
    );

    const totalQuantity =
      Number(position.quantity) + quantity;

    const totalInvested =
      Number(position.invested_amount) +
      additionalInvestment;

    const averageEntryPrice =
      totalInvested / totalQuantity;

    return this.repository.addInvestment(
      positionId,
      {
        quantity: totalQuantity,
        investedAmount: totalInvested,
        averageEntryPrice,
      }
    );
  }

  close(positionId) {
    const position =
      this.repository.getById(positionId);

    if (!position) {
      throw new Error(
        `Position not found: ${positionId}`
      );
    }

    if (position.status !== 'OPEN') {
      throw new Error(
        `Position is not open: ${positionId}`
      );
    }

    return this.repository.close(positionId);
  }
}

function normalizeSymbol(symbol) {
  const normalized = String(symbol ?? '')
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new Error('symbol is required');
  }

  return normalized;
}

function validatePositive(value, name) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${name} must be a positive number`
    );
  }
}
