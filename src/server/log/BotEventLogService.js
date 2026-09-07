export class BotEventLogService {
  constructor(repository) {
    this.repository = repository;
  }

  log({
    eventType,
    level = 'INFO',
    message,
    symbol = null,
    details = null,
  }) {
    return this.repository.create({
      eventType,
      level,
      message,
      symbol,
      details,
    });
  }

  info(eventType, message, options = {}) {
    return this.log({
      eventType,
      level: 'INFO',
      message,
      ...options,
    });
  }

  warning(eventType, message, options = {}) {
    return this.log({
      eventType,
      level: 'WARNING',
      message,
      ...options,
    });
  }

  error(eventType, message, options = {}) {
    return this.log({
      eventType,
      level: 'ERROR',
      message,
      ...options,
    });
  }

  getAll() {
    return this.repository.getAll();
  }
}
