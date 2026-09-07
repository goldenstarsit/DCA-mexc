export class StopLossEngine {
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

    const { config } =
      this.botConfigService.get();

    const stopLossPercent =
      Number(config.stopLossPercent);

    if (
      !Number.isFinite(stopLossPercent) ||
      stopLossPercent < 0
    ) {
      throw new Error(
        'stopLossPercent must be a non-negative number'
      );
    }

    const lossPercent =
      ((averageEntryPrice - currentPrice) /
        averageEntryPrice) *
      100;

    const stopPrice =
      averageEntryPrice *
      (1 - stopLossPercent / 100);

    const triggered =
      lossPercent >= stopLossPercent;

    return {
      triggered,
      lossPercent,
      stopLossPercent,
      stopPrice,
      currentPrice,
      averageEntryPrice,
      reason: triggered
        ? 'STOP_LOSS_TRIGGERED'
        : 'STOP_LOSS_NOT_REACHED',
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
