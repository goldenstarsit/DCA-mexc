export class MexcWebSocketError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MexcWebSocketError';
    this.code = details.code ?? null;
    this.event = details.event ?? null;
  }
}
