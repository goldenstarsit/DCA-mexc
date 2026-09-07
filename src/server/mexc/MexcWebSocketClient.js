const DEFAULT_URL = 'ws://wbs-api.mexc.com/ws';
const DEFAULT_RECONNECT_DELAY_MS = 3000;
const DEFAULT_PING_INTERVAL_MS = 20000;

export class MexcWebSocketClient {
  constructor(options = {}) {
    this.url = options.url || process.env.MEXC_WS_URL || DEFAULT_URL;
    this.WebSocketImpl = options.WebSocketImpl || globalThis.WebSocket;

    if (!this.WebSocketImpl) {
      throw new Error('WebSocket is not available in this Node.js runtime');
    }

    this.reconnectDelayMs =
      Number(
        options.reconnectDelayMs ||
        process.env.MEXC_WS_RECONNECT_DELAY_MS ||
        DEFAULT_RECONNECT_DELAY_MS
      );

    this.pingIntervalMs =
      Number(
        options.pingIntervalMs ||
        process.env.MEXC_WS_PING_INTERVAL_MS ||
        DEFAULT_PING_INTERVAL_MS
      );

    this.socket = null;
    this.connected = false;
    this.manualClose = false;
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.subscriptions = new Set();

    this.handlers = {
      open: options.onOpen || (() => {}),
      message: options.onMessage || (() => {}),
      error: options.onError || (() => {}),
      close: options.onClose || (() => {}),
    };
  }

  connect() {
    if (
      this.socket &&
      (
        this.socket.readyState === this.WebSocketImpl.OPEN ||
        this.socket.readyState === this.WebSocketImpl.CONNECTING
      )
    ) {
      return;
    }

    this.manualClose = false;

    const socket = new this.WebSocketImpl(this.url);
    this.socket = socket;

    socket.onopen = () => {
      this.connected = true;
      this.startPing();

      this.handlers.open();

      for (const channel of this.subscriptions) {
        this.sendSubscription(channel);
      }
    };

    socket.onmessage = event => {
      let data;

      try {
        data =
          typeof event.data === 'string'
            ? JSON.parse(event.data)
            : event.data;
      } catch {
        data = event.data;
      }

      if (data?.msg === 'PONG') {
        return;
      }

      this.handlers.message(data);
    };

    socket.onerror = error => {
      this.handlers.error(error);
    };

    socket.onclose = event => {
      this.connected = false;
      this.stopPing();

      this.handlers.close(event);

      if (!this.manualClose) {
        this.scheduleReconnect();
      }
    };
  }

  disconnect() {
    this.manualClose = true;

    this.clearReconnect();
    this.stopPing();

    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // Ignore close errors.
      }
    }

    this.socket = null;
    this.connected = false;
  }

  subscribe(channel) {
    this.subscriptions.add(channel);

    if (this.connected) {
      this.sendSubscription(channel);
    }
  }

  unsubscribe(channel) {
    this.subscriptions.delete(channel);

    if (!this.connected) {
      return;
    }

    this.send({
      method: 'UNSUBSCRIPTION',
      params: [channel],
    });
  }

  subscribeTrade(symbol) {
    const normalizedSymbol = String(symbol).toUpperCase();

    const channel =
      `spot@public.aggre.deals.v3.api.pb@100ms@${normalizedSymbol}`;

    this.subscribe(channel);

    return channel;
  }

  subscribeBookTicker(symbol) {
    const normalizedSymbol = String(symbol).toUpperCase();

    const channel =
      `spot@public.aggre.bookTicker.v3.api.pb@100ms@${normalizedSymbol}`;

    this.subscribe(channel);

    return channel;
  }

  sendSubscription(channel) {
    this.send({
      method: 'SUBSCRIPTION',
      params: [channel],
    });
  }

  send(payload) {
    if (
      !this.socket ||
      this.socket.readyState !== this.WebSocketImpl.OPEN
    ) {
      return false;
    }

    this.socket.send(JSON.stringify(payload));
    return true;
  }

  ping() {
    return this.send({
      method: 'PING',
    });
  }

  startPing() {
    this.stopPing();

    this.pingTimer = setInterval(() => {
      this.ping();
    }, this.pingIntervalMs);
  }

  stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  scheduleReconnect() {
    if (this.manualClose || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelayMs);
  }

  clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  isConnected() {
    return this.connected;
  }
}
