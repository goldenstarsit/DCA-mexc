import { NextResponse } from 'next/server';

import { getDatabase } from '@/server/database';
import { DcaLevelRepository } from '@/server/dca/DcaLevelRepository.js';
import { DcaLevelService } from '@/server/dca/DcaLevelService.js';

export const runtime = 'nodejs';

function getService() {
  const db = getDatabase();
  const repository = new DcaLevelRepository(db);

  return new DcaLevelService(repository);
}

export async function GET() {
  try {
    const service = getService();

    return NextResponse.json({
      ok: true,
      levels: service.getAll(),
    });
  } catch (error) {
    console.error('DCA_LEVELS_GET_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const service = getService();

    const level = service.create({
      level: body.level,
      triggerPercent:
        body.triggerPercent,
      quantity: body.quantity,
      enabled:
        body.enabled ?? true,
    });

    return NextResponse.json(
      {
        ok: true,
        level,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('DCA_LEVELS_POST_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? String(error),
      },
      { status: 400 }
    );
  }
}
