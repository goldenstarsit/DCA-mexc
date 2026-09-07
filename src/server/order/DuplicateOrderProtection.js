import crypto from 'node:crypto';

export class DuplicateOrderProtection {
  constructor(repository) {
    this.repository = repository;
  }

  buildRequestKey({
    symbol,
    side,
    type,
    quantity,
    price = null,
  }) {
    const payload = JSON.stringify({
      symbol: String(symbol).trim().toUpperCase(),
      side: String(side).trim().toUpperCase(),
      type: String(type).trim().toUpperCase(),
      quantity,
      price,
    });

    return crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex');
  }

  getExisting(requestKey) {
    return this.repository.getByKey(requestKey);
  }

  reserve(order) {
    const requestKey =
      this.buildRequestKey(order);

    const existing =
      this.repository.getByKey(requestKey);

    if (existing) {
      return {
        duplicate: true,
        requestKey,
        record: existing,
      };
    }

    const record =
      this.repository.create({
        requestKey,
        ...order,
      });

    return {
      duplicate: false,
      requestKey,
      record,
    };
  }

  markCompleted(id, exchangeOrderId) {
    return this.repository.markCompleted(
      id,
      exchangeOrderId
    );
  }

  markFailed(id) {
    return this.repository.markFailed(id);
  }
}
