export class MexcApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MexcApiError';
    this.code = details.code ?? null;
    this.status = details.status ?? null;
    this.body = details.body ?? null;
    this.endpoint = details.endpoint ?? null;
  }
}
