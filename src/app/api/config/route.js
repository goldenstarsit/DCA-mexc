import { NextResponse } from 'next/server';

import { getDatabase } from '@/server/database';
import { BotConfigRepository } from '@/server/botConfig/BotConfigRepository.js';
import { BotConfigService } from '@/server/botConfig/BotConfigService.js';

export const runtime = 'nodejs';

function getService() {
  const db = getDatabase();
  const repository = new BotConfigRepository(db);

  return new BotConfigService(repository);
}

export async function GET() {
  try {
    const service = getService();

    return NextResponse.json({
      ok: true,
      config: service.get(),
    });
  } catch (error) {
    console.error('BOT_CONFIG_GET_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const service = getService();

    const current = service.get();
    const currentConfig = current.config;

    const config = service.save({
      maxInvestment:
        body.maxInvestment ??
        currentConfig.maxInvestment,

      maxOpenPositions:
        body.maxOpenPositions ??
        currentConfig.maxOpenPositions,

      initialEntryEnabled:
        body.initialEntryEnabled ??
        currentConfig.initialEntryEnabled,

      takeProfitPercent:
        body.takeProfitPercent ??
        currentConfig.takeProfitPercent,

      stopLossPercent:
        body.stopLossPercent ??
        currentConfig.stopLossPercent,
    });

    return NextResponse.json({
      ok: true,
      config,
    });
  } catch (error) {
    console.error('BOT_CONFIG_PATCH_ERROR', error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? String(error),
      },
      { status: 400 }
    );
  }
}
