import { NextResponse } from 'next/server';
import { logServerError } from '@/server/core/SafeLogger.js';

import { getDatabase } from '@/server/database';
import { BotEventLogRepository } from '@/server/log/BotEventLogRepository.js';
import { BotEventLogService } from '@/server/log/BotEventLogService.js';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDatabase();

    const repository =
      new BotEventLogRepository(db);

    const service =
      new BotEventLogService(repository);

    return NextResponse.json({
      ok: true,
      logs: service.getAll(),
    });
  } catch (error) {
    logServerError('BOT_LOGS_GET_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
