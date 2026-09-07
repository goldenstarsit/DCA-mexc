const DEFAULT_CONFIG = {
  triggerMode: 'PRICE_DROP',
  requirePriceBelowEntry: true,
};

const VALID_TRIGGER_MODES = [
  'PRICE_DROP',
];

export class DcaTriggerConfigService {
  constructor(repository) {
    this.repository = repository;
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
}

function normalizeInput(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('DCA trigger configuration is required');
  }

  const triggerMode =
    config.triggerMode;

  if (
    typeof triggerMode !== 'string' ||
    !VALID_TRIGGER_MODES.includes(triggerMode)
  ) {
    throw new Error(
      `triggerMode must be one of: ${VALID_TRIGGER_MODES.join(', ')}`
    );
  }

  if (
    typeof config.requirePriceBelowEntry !== 'boolean'
  ) {
    throw new Error(
      'requirePriceBelowEntry must be a boolean'
    );
  }

  return {
    triggerMode,
    requirePriceBelowEntry:
      config.requirePriceBelowEntry,
  };
}

function normalize(row) {
  return {
    triggerMode: row.trigger_mode,
    requirePriceBelowEntry:
      row.require_price_below_entry === 1,
  };
}
