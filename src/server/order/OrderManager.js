export class OrderManager {
  constructor(mexcClient, duplicateProtection) {
    this.mexcClient = mexcClient;
    this.duplicateProtection = duplicateProtection;
  }

  async place({
    symbol,
    side,
    type = 'MARKET',
    quantity,
    price,
  }) {
    const normalizedSymbol =
      normalizeSymbol(symbol);

    const normalizedSide =
      normalizeEnum(
        side,
        ['BUY', 'SELL'],
        'side'
      );

    const normalizedType =
      normalizeEnum(
        type,
        ['MARKET', 'LIMIT'],
        'type'
      );

    validatePositive(quantity, 'quantity');

    if (normalizedType === 'LIMIT') {
      validatePositive(price, 'price');
    }

    const order = {
      symbol: normalizedSymbol,
      side: normalizedSide,
      type: normalizedType,
      quantity,
      ...(normalizedType === 'LIMIT'
        ? { price }
        : {}),
    };

    const reservation =
      this.duplicateProtection.reserve(order);

    if (reservation.duplicate) {
      throw new Error(
        `Duplicate order request: ${reservation.requestKey}`
      );
    }

    const params = {
      ...order,
    };

    if (normalizedType === 'LIMIT') {
      params.timeInForce = 'GTC';
    }

    try {
      const response =
        await this.mexcClient.order(params);

      const exchangeOrderId =
        response?.orderId ??
        response?.orderID ??
        null;

      this.duplicateProtection.markCompleted(
        reservation.record.id,
        exchangeOrderId
      );

      return {
        ...order,
        response,
      };
    } catch (error) {
      this.duplicateProtection.markFailed(
        reservation.record.id
      );

      throw error;
    }
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
