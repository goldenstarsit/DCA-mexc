const subscribers = new Set();

export function subscribe(listener) {
  subscribers.add(listener);

  return () => {
    subscribers.delete(listener);
  };
}

export function publish(event, data = {}) {
  const message = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  for (const listener of subscribers) {
    try {
      listener(message);
    } catch (error) {
      console.error('REALTIME_LISTENER_ERROR', error);
    }
  }
}
