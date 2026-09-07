const DEFAULT_CONFIG = {
  maxInvestment: 100,
  maxOpenPositions: 1,
  initialEntryEnabled: true,
  takeProfitPercent: 1,
  stopLossPercent: 3,
};

export class BotConfigService {
  constructor(repository) {
    this.repository = repository;
  }

  get() {
    const saved = this.repository.get();

    if (!saved) {
      return {
        config: { ...DEFAULT_CONFIG },
        updatedAt: null,
      };
    }

    return saved;
  }

  save(config) {
    const validated = validateConfig(config);

    return this.repository.save(validated);
  }

  update(patch) {
    const current = this.get().config;

    return this.save({
      ...current,
      ...patch,
    });
  }

  reset() {
    return this.repository.save({
      ...DEFAULT_CONFIG,
    });
  }
}

function validateConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Bot configuration must be an object');
  }

  const result = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  assertPositiveNumber(
    result.maxInvestment,
    'maxInvestment'
  );

  assertPositiveInteger(
    result.maxOpenPositions,
    'maxOpenPositions'
  );

  if (typeof result.initialEntryEnabled !== 'boolean') {
    throw new Error(
      'initialEntryEnabled must be a boolean'
    );
  }

  assertNonNegativeNumber(
    result.takeProfitPercent,
    'takeProfitPercent'
  );

  assertNonNegativeNumber(
    result.stopLossPercent,
    'stopLossPercent'
  );

  return result;
}

function assertPositiveNumber(value, name) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(`${name} must be a positive number`);
  }
}

function assertPositiveInteger(value, name) {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function assertNonNegativeNumber(value, name) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${name} must be a non-negative number`
    );
  }
}

export { DEFAULT_CONFIG };
