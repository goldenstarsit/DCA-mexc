'use client';

import { useEffect } from 'react';

export function useRealtime(onEvent) {
  useEffect(() => {
    const source = new EventSource('/api/realtime');

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data);
        onEvent?.(event);
      } catch (error) {
        console.error(
          'REALTIME_MESSAGE_ERROR',
          error
        );
      }
    };

    source.onerror = () => {
      console.warn('REALTIME_CONNECTION_ERROR');
    };

    return () => {
      source.close();
    };
  }, [onEvent]);
}
