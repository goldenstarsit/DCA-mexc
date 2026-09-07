import { NextResponse } from 'next/server';
import { getDatabase } from '@/server/database';

import { BotRuntimeRepository } from '@/server/bot/BotRuntimeRepository.js';
import { PositionRepository } from '@/server/position/PositionRepository.js';

import { TradingPairRepository } from '@/server/tradingPair/TradingPairRepository.js';
import { TradingPairService } from '@/server/tradingPair/TradingPairService.js';

import { BotConfigRepository } from '@/server/botConfig/BotConfigRepository.js';
import { BotConfigService } from '@/server/botConfig/BotConfigService.js';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDatabase();

    const runtimeRepository =
      new BotRuntimeRepository(db);

    const positionRepository =
      new PositionRepository(db);

    const tradingPairRepository =
      new TradingPairRepository(db);

    const tradingPairService =
      new TradingPairService(
        tradingPairRepository
      );

    const botConfigRepository =
      new BotConfigRepository(db);

    const botConfigService =
      new BotConfigService(
        botConfigRepository
      );

    const runtime =
      runtimeRepository.get();

    const positions =
      positionRepository.getOpen();

    const position =
      positions[0] ?? null;

    const pair =
      tradingPairService.get();

    const config =
      botConfigService.get();

    return NextResponse.json({
      ok: true,

      bot: {
        state:
          runtime?.state ?? 'STOPPED',

        updatedAt:
          runtime?.updated_at ?? null,
      },

      pair:
        pair?.symbol ?? null,

      position: position
        ? {
            id: position.id,
            symbol: position.symbol,
            quantity: Number(
              position.quantity
            ),
            investedAmount: Number(
              position.invested_amount
            ),
            averageEntryPrice: Number(
              position.average_entry_price
            ),
            openedAt:
              position.opened_at,
          }
        : null,

      config: {
        maxInvestment: Number(
          config.config.maxInvestment
        ),
        maxOpenPositions: Number(
          config.config.maxOpenPositions
        ),
        initialEntryEnabled:
          Boolean(
            config.config.initialEntryEnabled
          ),
        takeProfitPercent: Number(
          config.config.takeProfitPercent
        ),
        stopLossPercent: Number(
          config.config.stopLossPercent
        ),
      },

      timestamp:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      'DASHBOARD_API_ERROR',
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ??
          String(error),
      },
      { status: 500 }
    );
  }
}
