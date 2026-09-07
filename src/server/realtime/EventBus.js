import { logServerError } from '../core/SafeLogger.js';

const subscribers = new Set();

export function subscribe(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('Realtime subscriber must be a function');
  }

  subscribers.add(listener);

  return () => {
    subscribers.delete(listener);
  };
}

export function publish(event, data = {}) {
  if (subscribers.size === 0) {
    return;
  }

  const message = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  for (const listener of subscribers) {
    try {
      listener(message);
    } catch (error) {
      logServerError('REALTIME_LISTENER_ERROR', error);
      subscribers.delete(listener);
    }
  }
}

export function getSubscriberCount() {
  return subscribers.size;
}
