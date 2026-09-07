import crypto from 'node:crypto';
import { MexcApiError } from './MexcApiError.js';

const DEFAULT_BASE_URL = 'https://api.mexc.com';
const DEFAULT_TIMEOUT_MS = 10_000;

export class MexcClient {
  constructor(options = {}) {
    this.baseUrl = (
      options.baseUrl ||
      process.env.MEXC_BASE_URL ||
      DEFAULT_BASE_URL
    ).replace(/\/+$/, '');

    this.apiKey =
      options.apiKey ??
      process.env.MEXC_API_KEY ??
      '';

    this.secretKey =
      options.secretKey ??
      process.env.MEXC_SECRET_KEY ??
      '';

    this.timeoutMs =
      Number(
        options.timeoutMs ??
        process.env.MEXC_TIMEOUT_MS ??
        DEFAULT_TIMEOUT_MS
      );

    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => Date.now());
  }

  hasCredentials() {
    return Boolean(this.apiKey && this.secretKey);
  }

  buildQuery(params = {}) {
    return Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      )
      .join('&');
  }

  sign(queryString) {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');
  }

  async request(method, path, params = {}, options = {}) {
    const {
      signed = false,
      body = undefined,
    } = options;

    const query = { ...params };

    if (signed) {
      if (!this.hasCredentials()) {
        throw new MexcApiError(
          'MEXC API credentials are not configured'
        );
      }

      query.timestamp = this.now();
    }

    let queryString = this.buildQuery(query);

    if (signed) {
      queryString += `${queryString ? '&' : ''}signature=${this.sign(queryString)}`;
    }

    const url =
      `${this.baseUrl}${path}` +
      (queryString ? `?${queryString}` : '');

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      this.timeoutMs
    );

    try {
      const response = await this.fetchImpl(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(signed
            ? {
                'X-MEXC-APIKEY': this.apiKey,
              }
            : {}),
          ...(body
            ? {
                'Content-Type': 'application/json',
              }
            : {}),
        },
        body: body
          ? JSON.stringify(body)
          : undefined,
        signal: controller.signal,
      });

      const text = await response.text();

      let data;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new MexcApiError(
          data?.msg ||
            data?.message ||
            `MEXC HTTP ${response.status}`,
          {
            code: data?.code ?? null,
            status: response.status,
            body: data,
            endpoint: path,
          }
        );
      }

      return data;
    } catch (error) {
      if (error instanceof MexcApiError) {
        throw error;
      }

      if (error?.name === 'AbortError') {
        throw new MexcApiError(
          `MEXC request timeout after ${this.timeoutMs}ms`,
          {
            endpoint: path,
          }
        );
      }

      throw new MexcApiError(
        `MEXC network error: ${error.message}`,
        {
          endpoint: path,
        }
      );
    } finally {
      clearTimeout(timer);
    }
  }

  ping() {
    return this.request('GET', '/api/v3/ping');
  }

  serverTime() {
    return this.request('GET', '/api/v3/time');
  }

  exchangeInfo(symbol) {
    return this.request(
      'GET',
      '/api/v3/exchangeInfo',
      symbol ? { symbol } : {}
    );
  }

  defaultSymbols() {
    return this.request(
      'GET',
      '/api/v3/defaultSymbols'
    );
  }

  tickerPrice(symbol) {
    return this.request(
      'GET',
      '/api/v3/ticker/price',
      symbol ? { symbol } : {}
    );
  }

  account() {
    return this.request(
      'GET',
      '/api/v3/account',
      {},
      { signed: true }
    );
  }
}
