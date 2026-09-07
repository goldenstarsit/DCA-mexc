import { NextResponse } from 'next/server';

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
    console.error('TRADE_HISTORY_GET_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
