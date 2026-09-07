import { subscribe } from '@/server/realtime/EventBus.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  let unsubscribe;

  const stream = new ReadableStream({
    start(controller) {
      const send = (message) => {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify(message)}\n\n`
          )
        );
      };

      send({
        event: 'CONNECTED',
        data: {},
        timestamp: new Date().toISOString(),
      });

      unsubscribe = subscribe(send);
    },

    cancel() {
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
