export class OrderManager {
  constructor(mexcClient) {
    this.mexcClient = mexcClient;
  }

  async place({
    symbol,
    side,
    type = 'MARKET',
    quantity,
    price,
  }) {
    const normalizedSymbol = normalizeSymbol(symbol);
    const normalizedSide = normalizeEnum(
      side,
      ['BUY', 'SELL'],
      'side'
    );
    const normalizedType = normalizeEnum(
      type,
      ['MARKET', 'LIMIT'],
      'type'
    );

    validatePositive(quantity, 'quantity');

    if (normalizedType === 'LIMIT') {
      validatePositive(price, 'price');
    }

    const params = {
      symbol: normalizedSymbol,
      side: normalizedSide,
      type: normalizedType,
      quantity,
    };

    if (normalizedType === 'LIMIT') {
      params.price = price;
      params.timeInForce = 'GTC';
    }

    const response =
      await this.mexcClient.order(params);

    return {
      symbol: normalizedSymbol,
      side: normalizedSide,
      type: normalizedType,
      quantity,
      ...(normalizedType === 'LIMIT'
        ? { price }
        : {}),
      response,
    };
  }
}

function normalizeSymbol(symbol) {
  const value = String(symbol ?? '')
    .trim()
    .toUpperCase();

  if (!value) {
    throw new Error('symbol is required');
  }

  return value;
}

function normalizeEnum(value, allowed, name) {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();

  if (!allowed.includes(normalized)) {
    throw new Error(
      `${name} must be one of: ${allowed.join(', ')}`
    );
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
