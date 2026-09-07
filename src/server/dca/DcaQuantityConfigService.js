const DEFAULT_CONFIG = {
  quantityMode: 'FIXED',
};

const VALID_QUANTITY_MODES = [
  'FIXED',
];

export class DcaQuantityConfigService {
  constructor(repository, symbolService = null) {
    this.repository = repository;
    this.symbolService = symbolService;
  }

  get() {
    const row = this.repository.get();

    if (!row) {
      return { ...DEFAULT_CONFIG };
    }

    return normalize(row);
  }

  save(config) {
    const normalized = normalizeInput(config);

    return normalize(
      this.repository.save(normalized)
    );
  }

  update(patch) {
    return this.save({
      ...this.get(),
      ...patch,
    });
  }

  reset() {
    return this.save(DEFAULT_CONFIG);
  }

  validateQuantity(quantity, symbolInfo) {
    validatePositiveQuantity(quantity);

    if (!symbolInfo || typeof symbolInfo !== 'object') {
      throw new Error('symbolInfo is required');
    }

    if (
      symbolInfo.minQuantity != null &&
      quantity < Number(symbolInfo.minQuantity)
    ) {
      throw new Error(
        `quantity must be at least ${symbolInfo.minQuantity}`
      );
    }

    if (
      symbolInfo.stepSize != null &&
      !isStepAligned(quantity, Number(symbolInfo.stepSize))
    ) {
      throw new Error(
        `quantity must match stepSize ${symbolInfo.stepSize}`
      );
    }

    return true;
  }
}

function normalizeInput(config) {
  if (!config || typeof config !== 'object') {
    throw new Error(
      'DCA quantity configuration is required'
    );
  }

  if (
    typeof config.quantityMode !== 'string' ||
    !VALID_QUANTITY_MODES.includes(
      config.quantityMode
    )
  ) {
    throw new Error(
      `quantityMode must be one of: ${VALID_QUANTITY_MODES.join(', ')}`
    );
  }

  return {
    quantityMode: config.quantityMode,
  };
}

function normalize(row) {
  return {
    quantityMode: row.quantity_mode,
  };
}

function validatePositiveQuantity(quantity) {
  if (
    typeof quantity !== 'number' ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      'quantity must be a positive number'
    );
  }
}

function isStepAligned(quantity, stepSize) {
  if (
    !Number.isFinite(stepSize) ||
    stepSize <= 0
  ) {
    return true;
  }

  const quotient = quantity / stepSize;

  return Math.abs(
    quotient - Math.round(quotient)
  ) < 1e-9;
}
