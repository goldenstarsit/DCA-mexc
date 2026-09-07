import { NextResponse } from 'next/server';

import { getDatabase } from '@/server/database';
import { OrderRequestRepository } from '@/server/order/OrderRequestRepository.js';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDatabase();
    const repository = new OrderRequestRepository(db);

    const orders = repository.getAll();

    return NextResponse.json({
      ok: true,
      orders,
    });
  } catch (error) {
    console.error('ORDERS_GET_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
