export class RiskManager {
  constructor(botConfigService, positionManager) {
    this.botConfigService = botConfigService;
    this.positionManager = positionManager;
  }

  checkEntry({
    quantity,
    price,
    investment,
  }) {
    validatePositive(quantity, 'quantity');
    validatePositive(price, 'price');

    const calculatedInvestment =
      investment ?? quantity * price;

    validatePositive(
      calculatedInvestment,
      'investment'
    );

    const config =
      this.botConfigService.get().config;

    const openPositions =
      this.positionManager.getOpen();

    const currentInvested =
      openPositions.reduce(
        (total, position) =>
          total + Number(position.invested_amount),
        0
      );

    const projectedInvestment =
      currentInvested + calculatedInvestment;

    if (
      projectedInvestment >
      Number(config.maxInvestment)
    ) {
      return denied(
        'MAX_INVESTMENT_EXCEEDED',
        {
          currentInvested,
          requestedInvestment:
            calculatedInvestment,
          projectedInvestment,
          maxInvestment:
            Number(config.maxInvestment),
        }
      );
    }

    if (
      openPositions.length >=
      Number(config.maxOpenPositions)
    ) {
      return denied(
        'MAX_OPEN_POSITIONS_REACHED',
        {
          openPositions:
            openPositions.length,
          maxOpenPositions:
            Number(config.maxOpenPositions),
        }
      );
    }

    return allowed({
      currentInvested,
      requestedInvestment:
        calculatedInvestment,
      projectedInvestment,
      maxInvestment:
        Number(config.maxInvestment),
      openPositions:
        openPositions.length,
      maxOpenPositions:
        Number(config.maxOpenPositions),
    });
  }

  checkDca({
    positionId,
    quantity,
    price,
    investment,
  }) {
    validatePositive(quantity, 'quantity');
    validatePositive(price, 'price');

    const additionalInvestment =
      investment ?? quantity * price;

    validatePositive(
      additionalInvestment,
      'investment'
    );

    const position =
      this.positionManager.getOpen().find(
        item =>
          Number(item.id) ===
          Number(positionId)
      );

    if (!position) {
      return denied('POSITION_NOT_FOUND');
    }

    const config =
      this.botConfigService.get().config;

    const currentInvested =
      Number(position.invested_amount);

    const projectedInvestment =
      currentInvested +
      additionalInvestment;

    if (
      projectedInvestment >
      Number(config.maxInvestment)
    ) {
      return denied(
        'MAX_INVESTMENT_EXCEEDED',
        {
          currentInvested,
          requestedInvestment:
            additionalInvestment,
          projectedInvestment,
          maxInvestment:
            Number(config.maxInvestment),
        }
      );
    }

    return allowed({
      currentInvested,
      requestedInvestment:
        additionalInvestment,
      projectedInvestment,
      maxInvestment:
        Number(config.maxInvestment),
      positionId:
        Number(position.id),
    });
  }

  checkSell({
    quantity,
  }) {
    validatePositive(quantity, 'quantity');

    return allowed({
      quantity,
      reason: 'SELL_RISK_CHECK_PASSED',
    });
  }
}

function allowed(details = {}) {
  return {
    allowed: true,
    reason: 'RISK_CHECK_PASSED',
    ...details,
  };
}

function denied(reason, details = {}) {
  return {
    allowed: false,
    reason,
    ...details,
  };
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
