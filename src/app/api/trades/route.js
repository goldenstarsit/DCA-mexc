import { NextResponse } from 'next/server';
import { logServerError } from '@/server/core/SafeLogger.js';

import { getDatabase } from '@/server/database';
import { TradeHistoryRepository } from '@/server/trade/TradeHistoryRepository.js';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDatabase();
    const repository = new TradeHistoryRepository(db);

    return NextResponse.json({
      ok: true,
      trades: repository.getAll(),
    });
  } catch (error) {
    logServerError('TRADE_HISTORY_GET_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
