import { test, describe, expect, it } from 'vitest';

import { DcaStrategyEngine } from '../src/server/dca/DcaStrategyEngine.js';
import { TakeProfitEngine } from '../src/server/takeProfit/TakeProfitEngine.js';
import { StopLossEngine } from '../src/server/stopLoss/StopLossEngine.js';
import { RiskManager } from '../src/server/risk/RiskManager.js';
import { TradingStateMachine } from '../src/server/tradingState/TradingStateMachine.js';
import { InitialEntryEngine } from '../src/server/entry/InitialEntryEngine.js';
import { PositionManager } from '../src/server/position/PositionManager.js';
import { OrderManager } from '../src/server/order/OrderManager.js';
import { DuplicateOrderProtection } from '../src/server/order/DuplicateOrderProtection.js';
import { RestartRecoveryService } from '../src/server/recovery/RestartRecoveryService.js';
import { MexcReconciliationService } from '../src/server/reconciliation/MexcReconciliationService.js';
import { withRetry } from '../src/server/core/Retry.js';
import { MexcApiError } from '../src/server/mexc/MexcApiError.js';
import { MexcWebSocketError } from '../src/server/mexc/MexcWebSocketError.js';

describe('DCA Strategy Engine', () => {
  const levels = [
    {
      id: 1,
      level: 1,
      trigger_percent: 5,
      quantity: 1,
      enabled: 1,
    },
    {
      id: 2,
      level: 2,
      trigger_percent: 8,
      quantity: 2,
      enabled: 1,
    },
    {
      id: 3,
      level: 3,
      trigger_percent: 10,
      quantity: 3,
      enabled: 1,
    },
  ];

  const engine = new DcaStrategyEngine({
    getAll: () => levels,
  });

  it('triggers the highest eligible DCA level', () => {
    const result = engine.evaluate({
      entryPrice: 100,
      currentPrice: 89,
      lastTriggeredLevel: 0,
    });

    expect(result.triggered).toBe(true);
    expect(result.level.level).toBe(3);
    expect(result.level.quantity).toBe(3);
  });

  it('does not trigger when price is above entry', () => {
    const result = engine.evaluate({
      entryPrice: 100,
      currentPrice: 105,
    });

    expect(result.triggered).toBe(false);
    expect(result.reason).toBe('PRICE_NOT_BELOW_ENTRY');
  });

  it('does not trigger an already triggered level', () => {
    const result = engine.evaluate({
      entryPrice: 100,
      currentPrice: 94,
      lastTriggeredLevel: 1,
    });

    expect(result.triggered).toBe(false);
    expect(result.reason).toBe('NO_DCA_LEVEL_TRIGGERED');
  });
});

describe('Take Profit Engine', () => {
  const engine = new TakeProfitEngine({
    get: () => ({
      config: {
        takeProfitPercent: 1,
      },
    }),
  });

  it('triggers at take profit target', () => {
    const result = engine.evaluate({
      averageEntryPrice: 100,
      currentPrice: 101,
    });

    expect(result.triggered).toBe(true);
    expect(result.takeProfitPercent).toBe(1);
    expect(result.targetPrice).toBe(101);
  });

  it('does not trigger before target', () => {
    const result = engine.evaluate({
      averageEntryPrice: 100,
      currentPrice: 100.5,
    });

    expect(result.triggered).toBe(false);
    expect(result.reason).toBe('TAKE_PROFIT_NOT_REACHED');
  });
});

describe('Stop Loss Engine', () => {
  const engine = new StopLossEngine({
    get: () => ({
      config: {
        stopLossPercent: 3,
      },
    }),
  });

  it('triggers at stop loss target', () => {
    const result = engine.evaluate({
      averageEntryPrice: 100,
      currentPrice: 97,
    });

    expect(result.triggered).toBe(true);
    expect(result.stopLossPercent).toBe(3);
    expect(result.stopPrice).toBe(97);
  });

  it('does not trigger before stop loss', () => {
    const result = engine.evaluate({
      averageEntryPrice: 100,
      currentPrice: 98,
    });

    expect(result.triggered).toBe(false);
    expect(result.reason).toBe('STOP_LOSS_NOT_REACHED');
  });
});

describe('Risk Manager', () => {
  const botConfigService = {
    get: () => ({
      config: {
        maxInvestment: 100,
        maxOpenPositions: 2,
      },
    }),
  };

  it('allows an entry within investment and position limits', () => {
    const positionManager = {
      getOpen: () => [],
    };

    const risk = new RiskManager(
      botConfigService,
      positionManager
    );

    const result = risk.checkEntry({
      quantity: 0.5,
      price: 100,
      investment: 50,
    });

    expect(result.allowed).toBe(true);
    expect(result.projectedInvestment).toBe(50);
  });

  it('denies entry when maximum investment is exceeded', () => {
    const positionManager = {
      getOpen: () => [
        {
          invested_amount: 80,
        },
      ],
    };

    const risk = new RiskManager(
      botConfigService,
      positionManager
    );

    const result = risk.checkEntry({
      quantity: 0.3,
      price: 100,
      investment: 30,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('MAX_INVESTMENT_EXCEEDED');
  });

  it('denies entry when maximum open positions is reached', () => {
    const positionManager = {
      getOpen: () => [
        { invested_amount: 20 },
        { invested_amount: 20 },
      ],
    };

    const risk = new RiskManager(
      botConfigService,
      positionManager
    );

    const result = risk.checkEntry({
      quantity: 0.2,
      price: 50,
      investment: 10,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe(
      'MAX_OPEN_POSITIONS_REACHED'
    );
  });
});

describe('Trading State Machine', () => {
  it('starts in STOPPED state', () => {
    const machine = new TradingStateMachine();

    expect(machine.getState()).toBe('STOPPED');
  });

  it('transitions STOPPED -> RUNNING', () => {
    const machine = new TradingStateMachine();

    machine.transition('RUNNING');

    expect(machine.getState()).toBe('RUNNING');
  });

  it('transitions RUNNING -> ENTRY_PENDING -> POSITION_OPEN', () => {
    const machine = new TradingStateMachine();

    machine.transition('RUNNING');
    machine.transition('ENTRY_PENDING');
    machine.transition('POSITION_OPEN');

    expect(machine.getState()).toBe('POSITION_OPEN');
  });
});

describe('Initial Entry Engine', () => {
  const createEngine = ({
    initialEntryEnabled = true,
    maxOpenPositions = 1,
    maxInvestment = 100,
    tradingPair = { symbol: 'BTCUSDT' },
  } = {}) => {
    return new InitialEntryEngine(
      {
        get: () => ({
          config: {
            initialEntryEnabled,
            maxOpenPositions,
            maxInvestment,
          },
        }),
      },
      {
        get: () => tradingPair,
      }
    );
  };

  it('allows a valid initial entry', async () => {
    const engine = createEngine();

    const result = await engine.evaluate({
      symbol: 'btcusdt',
      currentPrice: 50000,
      openPositionCount: 0,
    });

    expect(result.allowed).toBe(true);
    expect(result.symbol).toBe('BTCUSDT');
    expect(result.investment).toBe(100);
    expect(result.quantity).toBe(100 / 50000);
  });

  it('denies initial entry when disabled', async () => {
    const engine = createEngine({
      initialEntryEnabled: false,
    });

    const result = await engine.evaluate({
      symbol: 'BTCUSDT',
      currentPrice: 50000,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('INITIAL_ENTRY_DISABLED');
  });

  it('denies when maximum open positions is reached', async () => {
    const engine = createEngine({
      maxOpenPositions: 1,
    });

    const result = await engine.evaluate({
      symbol: 'BTCUSDT',
      currentPrice: 50000,
      openPositionCount: 1,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe(
      'MAX_OPEN_POSITIONS_REACHED'
    );
  });
});

describe('Position Manager', () => {
  function createManager({
    openPositions = [],
    existingBySymbol = null,
    byId = null,
  } = {}) {
    const repository = {
      getOpen: () => openPositions,
      getOpenBySymbol: () => existingBySymbol,
      getById: () => byId,
      create: data => ({
        id: 1,
        status: 'OPEN',
        ...data,
      }),
      addInvestment: (id, data) => ({
        id,
        status: 'OPEN',
        ...data,
      }),
      close: id => ({
        id,
        status: 'CLOSED',
      }),
    };

    const botConfigService = {
      get: () => ({
        config: {
          maxOpenPositions: 1,
        },
      }),
    };

    return new PositionManager(
      repository,
      botConfigService
    );
  }

  it('opens a new position with calculated average entry price', () => {
    const manager = createManager();

    const result = manager.open({
      symbol: 'btcusdt',
      quantity: 2,
      price: 50,
    });

    expect(result.symbol).toBe('BTCUSDT');
    expect(result.quantity).toBe(2);
    expect(result.investedAmount).toBe(100);
    expect(result.averageEntryPrice).toBe(50);
  });

  it('adds investment and recalculates average entry price', () => {
    const manager = createManager({
      byId: {
        id: 1,
        status: 'OPEN',
        quantity: 2,
        invested_amount: 100,
      },
    });

    const result = manager.addToPosition({
      positionId: 1,
      quantity: 1,
      price: 40,
    });

    expect(result.quantity).toBe(3);
    expect(result.investedAmount).toBe(140);
    expect(result.averageEntryPrice).toBeCloseTo(
      46.6666666667
    );
  });

  it('rejects opening a duplicate symbol position', () => {
    const manager = createManager({
      existingBySymbol: {
        id: 1,
        symbol: 'BTCUSDT',
        status: 'OPEN',
      },
    });

    expect(() =>
      manager.open({
        symbol: 'BTCUSDT',
        quantity: 1,
        price: 100,
      })
    ).toThrow(
      'Open position already exists: BTCUSDT'
    );
  });
});

describe('Order Manager', () => {
  it('places a normalized market order', async () => {
    const calls = [];

    const mexcClient = {
      order: async params => {
        calls.push(params);
        return {
          orderId: 'MEXC-TEST-001',
        };
      },
    };

    const duplicateProtection = {
      reserve: order => ({
        duplicate: false,
        requestKey: 'test-key',
        record: { id: 1 },
      }),
      markCompleted: (id, exchangeOrderId) => ({
        id,
        exchangeOrderId,
      }),
      markFailed: () => {},
    };

    const manager = new OrderManager(
      mexcClient,
      duplicateProtection
    );

    const result = await manager.place({
      symbol: 'btcusdt',
      side: 'buy',
      quantity: 0.001,
    });

    expect(result.symbol).toBe('BTCUSDT');
    expect(result.side).toBe('BUY');
    expect(result.type).toBe('MARKET');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 0.001,
    });
  });

  it('adds GTC to limit orders', async () => {
    let sentOrder;

    const manager = new OrderManager(
      {
        order: async params => {
          sentOrder = params;
          return { orderId: 'LIMIT-TEST-001' };
        },
      },
      {
        reserve: () => ({
          duplicate: false,
          record: { id: 2 },
        }),
        markCompleted: () => {},
        markFailed: () => {},
      }
    );

    await manager.place({
      symbol: 'BTCUSDT',
      side: 'SELL',
      type: 'LIMIT',
      quantity: 0.002,
      price: 51000,
    });

    expect(sentOrder).toEqual({
      symbol: 'BTCUSDT',
      side: 'SELL',
      type: 'LIMIT',
      quantity: 0.002,
      price: 51000,
      timeInForce: 'GTC',
    });
  });

  it('rejects a duplicate order before calling MEXC', async () => {
    let called = false;

    const manager = new OrderManager(
      {
        order: async () => {
          called = true;
          return { orderId: 'SHOULD-NOT-HAPPEN' };
        },
      },
      {
        reserve: () => ({
          duplicate: true,
          requestKey: 'duplicate-key',
          record: { id: 3 },
        }),
      }
    );

    await expect(
      manager.place({
        symbol: 'BTCUSDT',
        side: 'BUY',
        quantity: 0.001,
      })
    ).rejects.toThrow(
      'Duplicate order request: duplicate-key'
    );

    expect(called).toBe(false);
  });
});

describe('Duplicate Order Protection', () => {
  it('generates the same key for equivalent normalized orders', async () => {
    const repository = {
      getByKey: () => null,
      create: data => ({
        id: 1,
        ...data,
      }),
    };

    const protection =
      new DuplicateOrderProtection(repository);

    const key1 = protection.buildRequestKey({
      symbol: 'btcusdt',
      side: 'buy',
      type: 'market',
      quantity: 0.001,
    });

    const key2 = protection.buildRequestKey({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 0.001,
    });

    expect(key1).toBe(key2);
    expect(key1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('reserves a new order request', () => {
    let created;

    const protection =
      new DuplicateOrderProtection({
        getByKey: () => null,
        create: data => {
          created = data;
          return {
            id: 10,
            ...data,
          };
        },
      });

    const result = protection.reserve({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 0.001,
    });

    expect(result.duplicate).toBe(false);
    expect(result.record.id).toBe(10);
    expect(created.requestKey).toBe(result.requestKey);
  });

  it('detects an existing order request', () => {
    const existing = {
      id: 20,
      status: 'COMPLETED',
    };

    const protection =
      new DuplicateOrderProtection({
        getByKey: () => existing,
      });

    const result = protection.reserve({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 0.001,
    });

    expect(result.duplicate).toBe(true);
    expect(result.record).toBe(existing);
  });
});


describe('Restart Recovery Service', () => {
  it('recovers runtime state, open positions and processing orders', () => {
    const service = new RestartRecoveryService({
      botRuntimeRepository: {
        get: () => ({
          state: 'POSITION_OPEN',
          updated_at: '2026-01-01T00:00:00.000Z',
        }),
      },
      positionRepository: {
        getAllOpen: () => [
          {
            id: 1,
            symbol: 'BTCUSDT',
            status: 'OPEN',
          },
        ],
      },
      orderRequestRepository: {
        getAll: () => [
          { id: 1, status: 'PROCESSING' },
          { id: 2, status: 'COMPLETED' },
        ],
      },
    });

    const result = service.recover();

    expect(result.state).toBe('POSITION_OPEN');
    expect(result.updatedAt).toBe(
      '2026-01-01T00:00:00.000Z'
    );
    expect(result.openPositions).toHaveLength(1);
    expect(result.processingOrders).toHaveLength(1);
    expect(result.processingOrders[0].id).toBe(1);
    expect(result.recoveredAt).toBeTypeOf('string');
  });

  it('falls back to STOPPED when runtime state is missing', () => {
    const service = new RestartRecoveryService({
      botRuntimeRepository: {
        get: () => null,
      },
      positionRepository: {
        getAllOpen: () => [],
      },
      orderRequestRepository: {
        getAll: () => [],
      },
    });

    const result = service.recover();

    expect(result.state).toBe('STOPPED');
    expect(result.updatedAt).toBeNull();
    expect(result.openPositions).toHaveLength(0);
    expect(result.processingOrders).toHaveLength(0);
  });
});

describe('MEXC Reconciliation Service', () => {
  it('reconciles local positions with the exchange balance', async () => {
    const service = new MexcReconciliationService({
      mexcClient: {
        account: async () => ({
          balances: [
            {
              asset: 'BTC',
              free: '0.005',
              locked: '0.001',
            },
            {
              asset: 'USDT',
              free: '100',
              locked: '0',
            },
          ],
        }),
      },
      positionRepository: {
        getAllOpen: () => [
          {
            id: 1,
            symbol: 'BTCUSDT',
            quantity: 0.003,
          },
        ],
      },
      tradingPairService: {
        get: () => ({
          symbol: 'BTCUSDT',
        }),
      },
    });

    const result = await service.reconcile();

    expect(result.symbol).toBe('BTCUSDT');
    expect(result.localPositions).toHaveLength(1);
    expect(result.exchangeBalance).toEqual({
      asset: 'BTC',
      free: '0.005',
      locked: '0.001',
    });
    expect(result.account.balances).toHaveLength(2);
    expect(result.reconciledAt).toBeTypeOf('string');
  });

  it('handles a missing exchange balance', async () => {
    const service = new MexcReconciliationService({
      mexcClient: {
        account: async () => ({
          balances: [
            {
              asset: 'USDT',
              free: '100',
              locked: '0',
            },
          ],
        }),
      },
      positionRepository: {
        getAllOpen: () => [],
      },
      tradingPairService: {
        get: () => ({
          symbol: 'BTCUSDT',
        }),
      },
    });

    const result = await service.reconcile();

    expect(result.symbol).toBe('BTCUSDT');
    expect(result.exchangeBalance).toBeNull();
  });
});

describe('Retry Helper', () => {
  it('retries a failed operation and eventually succeeds', async () => {
    let attempts = 0;

    const result = await withRetry(
      async attempt => {
        attempts += 1;

        if (attempt < 2) {
          throw new Error('temporary failure');
        }

        return 'success';
      },
      {
        retries: 3,
        delayMs: 0,
      }
    );

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('throws after the retry limit is exhausted', async () => {
    let attempts = 0;

    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error('permanent failure');
        },
        {
          retries: 2,
          delayMs: 0,
        }
      )
    ).rejects.toThrow('permanent failure');

    expect(attempts).toBe(3);
  });

  it('respects shouldRetry and stops retrying when denied', async () => {
    let attempts = 0;

    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error('do not retry');
        },
        {
          retries: 5,
          delayMs: 0,
          shouldRetry: () => false,
        }
      )
    ).rejects.toThrow('do not retry');

    expect(attempts).toBe(1);
  });
});

describe('MEXC Error Classes', () => {
  it('creates a MEXC API error with details', () => {
    const error = new MexcApiError(
      'API request failed',
      {
        code: 700001,
        status: 400,
        body: {
          msg: 'Invalid request',
        },
        endpoint: '/api/v3/order',
      }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('MexcApiError');
    expect(error.message).toBe('API request failed');
    expect(error.code).toBe(700001);
    expect(error.status).toBe(400);
    expect(error.body.msg).toBe('Invalid request');
    expect(error.endpoint).toBe('/api/v3/order');
  });

  it('creates a MEXC WebSocket error with details', () => {
    const error = new MexcWebSocketError(
      'WebSocket connection failed',
      {
        code: 1006,
        event: 'close',
      }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('MexcWebSocketError');
    expect(error.message).toBe(
      'WebSocket connection failed'
    );
    expect(error.code).toBe(1006);
    expect(error.event).toBe('close');
  });
});

import DatabaseDriver from 'better-sqlite3';
import { MexcCredentialsRepository } from '../src/server/mexc/repositories/MexcCredentialsRepository.js';

function createTestDatabase() {
  const db = new DatabaseDriver(':memory:');

  const migrations = [
    {
      id: '003_create_mexc_credentials',
      up(database) {
        database.exec(`
          CREATE TABLE IF NOT EXISTS mexc_credentials (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            api_key_encrypted TEXT NOT NULL,
            secret_key_encrypted TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);
      },
    },
  ];

  for (const migration of migrations) {
    migration.up(db);
  }

  return db;
}

describe('MexcCredentialsRepository', () => {
  test('returns null when credentials do not exist', () => {
    const db = createTestDatabase();
    const repository = new MexcCredentialsRepository(db);

    expect(repository.get()).toBeNull();

    db.close();
  });

  test('saves and retrieves encrypted credentials', () => {
    const db = createTestDatabase();
    const repository = new MexcCredentialsRepository(db);

    const saved = repository.save({
      apiKeyEncrypted: 'encrypted-api-key',
      secretKeyEncrypted: 'encrypted-secret-key',
    });

    expect(saved).not.toBeNull();
    expect(saved.id).toBe(1);
    expect(saved.api_key_encrypted).toBe('encrypted-api-key');
    expect(saved.secret_key_encrypted).toBe('encrypted-secret-key');
    expect(saved.created_at).toBeTruthy();
    expect(saved.updated_at).toBeTruthy();

    const stored = repository.get();

    expect(stored.api_key_encrypted).toBe('encrypted-api-key');
    expect(stored.secret_key_encrypted).toBe('encrypted-secret-key');

    db.close();
  });

  test('updates existing credentials instead of creating another row', async () => {
    const db = createTestDatabase();
    const repository = new MexcCredentialsRepository(db);

    const first = repository.save({
      apiKeyEncrypted: 'api-key-1',
      secretKeyEncrypted: 'secret-key-1',
    });

    await new Promise((resolve) => setTimeout(resolve, 2));

    const second = repository.save({
      apiKeyEncrypted: 'api-key-2',
      secretKeyEncrypted: 'secret-key-2',
    });

    expect(second.id).toBe(1);
    expect(second.api_key_encrypted).toBe('api-key-2');
    expect(second.secret_key_encrypted).toBe('secret-key-2');

    const count = db
      .prepare('SELECT COUNT(*) AS count FROM mexc_credentials')
      .get();

    expect(count.count).toBe(1);

    expect(second.created_at).toBe(first.created_at);
    expect(second.updated_at).toBeTruthy();

    db.close();
  });

  test('deletes credentials', () => {
    const db = createTestDatabase();
    const repository = new MexcCredentialsRepository(db);

    repository.save({
      apiKeyEncrypted: 'encrypted-api-key',
      secretKeyEncrypted: 'encrypted-secret-key',
    });

    const result = repository.delete();

    expect(result.changes).toBe(1);
    expect(repository.get()).toBeNull();

    db.close();
  });

  test('deleting when credentials do not exist is safe', () => {
    const db = createTestDatabase();
    const repository = new MexcCredentialsRepository(db);

    const result = repository.delete();

    expect(result.changes).toBe(0);
    expect(repository.get()).toBeNull();

    db.close();
  });
});

describe('Database migration integrity', () => {
  test('mexc credentials table enforces singleton id', () => {
    const db = createTestDatabase();

    expect(() => {
      db.prepare(`
        INSERT INTO mexc_credentials (
          id,
          api_key_encrypted,
          secret_key_encrypted,
          created_at,
          updated_at
        )
        VALUES (2, 'a', 'b', 'c', 'd')
      `).run();
    }).toThrow();

    db.close();
  });

  test('mexc credentials required fields reject null values', () => {
    const db = createTestDatabase();

    expect(() => {
      db.prepare(`
        INSERT INTO mexc_credentials (
          id,
          api_key_encrypted,
          secret_key_encrypted,
          created_at,
          updated_at
        )
        VALUES (1, NULL, 'secret', 'created', 'updated')
      `).run();
    }).toThrow();

    db.close();
  });
});

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function loadMigrationFiles() {
  const migrationsDir = path.resolve(
    'src/server/database/migrations'
  );

  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.cjs'))
    .sort()
    .map((file) => ({
      file,
      migration: require(path.join(migrationsDir, file)),
    }));
}

function runMigrations(db) {
  const files = loadMigrationFiles();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_id TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const applied = new Set(
    db
      .prepare(
        'SELECT migration_id FROM schema_migrations'
      )
      .all()
      .map((row) => row.migration_id)
  );

  const insertMigration = db.prepare(`
    INSERT INTO schema_migrations (migration_id)
    VALUES (?)
  `);

  let appliedCount = 0;

  for (const { file, migration } of files) {
    if (
      !migration.id ||
      typeof migration.up !== 'function'
    ) {
      throw new Error(`Invalid migration: ${file}`);
    }

    if (applied.has(migration.id)) {
      continue;
    }

    const runMigration = db.transaction(() => {
      migration.up(db);
      insertMigration.run(migration.id);
    });

    runMigration();
    appliedCount++;
  }

  return appliedCount;
}

describe('Full database migration system', () => {
  test('applies all migrations and creates all expected tables', () => {
    const db = new DatabaseDriver(':memory:');

    const appliedCount = runMigrations(db);

    expect(appliedCount).toBe(13);

    const migrations = db
      .prepare(`
        SELECT migration_id
        FROM schema_migrations
        ORDER BY id
      `)
      .all();

    expect(migrations).toHaveLength(13);

    const tables = db
      .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
      `)
      .all()
      .map((row) => row.name);

    expect(tables).toEqual(
      expect.arrayContaining([
        'schema_migrations',
        'app_meta',
        'mexc_credentials',
        'trading_pair_config',
        'bot_config',
        'dca_levels',
        'dca_trigger_config',
        'dca_quantity_config',
        'positions',
        'order_requests',
        'bot_runtime_state',
        'trade_history',
        'bot_event_logs',
      ])
    );

    db.close();
  });

  test('does not apply migrations twice', () => {
    const db = new DatabaseDriver(':memory:');

    const firstRun = runMigrations(db);
    const secondRun = runMigrations(db);

    expect(firstRun).toBe(13);
    expect(secondRun).toBe(0);

    const count = db
      .prepare(
        'SELECT COUNT(*) AS count FROM schema_migrations'
      )
      .get();

    expect(count.count).toBe(13);

    db.close();
  });

  test('creates STOPPED runtime state automatically', () => {
    const db = new DatabaseDriver(':memory:');

    runMigrations(db);

    const runtime = db
      .prepare(`
        SELECT id, state
        FROM bot_runtime_state
        WHERE id = 1
      `)
      .get();

    expect(runtime).toEqual({
      id: 1,
      state: 'STOPPED',
    });

    db.close();
  });

  test('migration order is sequential and complete', () => {
    const db = new DatabaseDriver(':memory:');

    runMigrations(db);

    const migrations = db
      .prepare(`
        SELECT migration_id
        FROM schema_migrations
        ORDER BY id
      `)
      .all()
      .map((row) => row.migration_id);

    expect(migrations).toEqual([
      '001_create_schema_migrations',
      '002_create_app_meta',
      '003_create_mexc_credentials',
      '004_create_trading_pair',
      '005_create_bot_config',
      '006_create_dca_levels',
      '007_create_dca_trigger_config',
      '008_create_dca_quantity_config',
      '009_create_positions',
      '010_create_order_requests',
      '011_create_bot_runtime_state',
      '012_create_trade_history',
      '013_create_bot_event_logs',
    ]);

    db.close();
  });
});
