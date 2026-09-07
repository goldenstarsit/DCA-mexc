export class DcaLevelService {
  constructor(repository) {
    this.repository = repository;
  }

  getAll() {
    return this.repository.getAll();
  }

  get(level) {
    const normalizedLevel = normalizeLevel(level);

    return this.repository.getByLevel(
      normalizedLevel
    );
  }

  create(data) {
    const validated = validateLevel(data);

    if (this.repository.getByLevel(validated.level)) {
      throw new Error(
        `DCA level already exists: ${validated.level}`
      );
    }

    return this.repository.create(validated);
  }

  update(level, data) {
    const normalizedLevel = normalizeLevel(level);

    const existing = this.repository.getByLevel(
      normalizedLevel
    );

    if (!existing) {
      throw new Error(
        `DCA level not found: ${normalizedLevel}`
      );
    }

    const merged = {
      level: normalizedLevel,
      triggerPercent:
        data.triggerPercent ??
        Number(existing.trigger_percent),
      quantity:
        data.quantity ??
        Number(existing.quantity),
      enabled:
        data.enabled ??
        existing.enabled === 1,
    };

    const validated = validateLevel(merged);

    return this.repository.update(
      normalizedLevel,
      validated
    );
  }

  delete(level) {
    const normalizedLevel = normalizeLevel(level);

    return this.repository.delete(
      normalizedLevel
    );
  }
}

function validateLevel(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('DCA level must be an object');
  }

  const level = normalizeLevel(data.level);

  if (
    typeof data.triggerPercent !== 'number' ||
    !Number.isFinite(data.triggerPercent) ||
    data.triggerPercent < 0
  ) {
    throw new Error(
      'triggerPercent must be a non-negative number'
    );
  }

  if (
    typeof data.quantity !== 'number' ||
    !Number.isFinite(data.quantity) ||
    data.quantity <= 0
  ) {
    throw new Error(
      'quantity must be a positive number'
    );
  }

  if (
    data.enabled !== undefined &&
    typeof data.enabled !== 'boolean'
  ) {
    throw new Error(
      'enabled must be a boolean'
    );
  }

  return {
    level,
    triggerPercent: data.triggerPercent,
    quantity: data.quantity,
    enabled: data.enabled ?? true,
  };
}

function normalizeLevel(level) {
  const value = Number(level);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      'level must be a positive integer'
    );
  }

  return value;
}
