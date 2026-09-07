export class DcaStrategyEngine {
  constructor(levelService) {
    this.levelService = levelService;
  }

  evaluate({
    entryPrice,
    currentPrice,
    lastTriggeredLevel = 0,
  }) {
    validatePrice(entryPrice, 'entryPrice');
    validatePrice(currentPrice, 'currentPrice');

    if (
      !Number.isInteger(lastTriggeredLevel) ||
      lastTriggeredLevel < 0
    ) {
      throw new Error(
        'lastTriggeredLevel must be a non-negative integer'
      );
    }

    const levels = this.levelService
      .getAll()
      .filter(level => level.enabled === 1)
      .sort((a, b) => a.level - b.level);

    const dropPercent =
      ((entryPrice - currentPrice) / entryPrice) * 100;

    if (dropPercent <= 0) {
      return {
        triggered: false,
        dropPercent,
        level: null,
        reason: 'PRICE_NOT_BELOW_ENTRY',
      };
    }

    const eligibleLevels = levels.filter(
      level =>
        level.level > lastTriggeredLevel &&
        Number(level.trigger_percent) <= dropPercent
    );

    if (eligibleLevels.length === 0) {
      return {
        triggered: false,
        dropPercent,
        level: null,
        reason: 'NO_DCA_LEVEL_TRIGGERED',
      };
    }

    const selected =
      eligibleLevels[eligibleLevels.length - 1];

    return {
      triggered: true,
      dropPercent,
      level: {
        id: selected.id,
        level: selected.level,
        triggerPercent: Number(
          selected.trigger_percent
        ),
        quantity: Number(selected.quantity),
        enabled: selected.enabled === 1,
      },
      reason: 'DCA_LEVEL_TRIGGERED',
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
