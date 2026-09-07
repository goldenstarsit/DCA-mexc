export class TakeProfitEngine {
  constructor(botConfigService) {
    this.botConfigService = botConfigService;
  }

  evaluate({
    averageEntryPrice,
    currentPrice,
  }) {
    validatePrice(
      averageEntryPrice,
      'averageEntryPrice'
    );

    validatePrice(
      currentPrice,
      'currentPrice'
    );

    const { config } = this.botConfigService.get();

    const takeProfitPercent =
      Number(config.takeProfitPercent);

    if (
      !Number.isFinite(takeProfitPercent) ||
      takeProfitPercent < 0
    ) {
      throw new Error(
        'takeProfitPercent must be a non-negative number'
      );
    }

    const profitPercent =
      ((currentPrice - averageEntryPrice) /
        averageEntryPrice) *
      100;

    const targetPrice =
      averageEntryPrice *
      (1 + takeProfitPercent / 100);

    const triggered =
      profitPercent >= takeProfitPercent;

    return {
      triggered,
      profitPercent,
      takeProfitPercent,
      targetPrice,
      currentPrice,
      averageEntryPrice,
      reason: triggered
        ? 'TAKE_PROFIT_TRIGGERED'
        : 'TAKE_PROFIT_NOT_REACHED',
    };
  }
}

function validatePrice(value, name) {
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
