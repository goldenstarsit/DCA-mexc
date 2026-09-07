require('dotenv').config({ path: '.env.local' });

(async () => {
  const { MexcReconciliationService } =
    await import(
      '../src/server/reconciliation/MexcReconciliationService.js'
    );

  const fakeClient = {
    async account() {
      return {
        balances: [
          {
            asset: 'BTC',
            free: '0.001',
            locked: '0',
          },
          {
            asset: 'USDT',
            free: '100',
            locked: '0',
          },
        ],
      };
    },
  };

  const fakePositionRepository = {
    getAllOpen() {
      return [];
    },
  };

  const fakeTradingPairService = {
    get() {
      return {
        symbol: 'BTCUSDT',
      };
    },
  };

  const service =
    new MexcReconciliationService({
      mexcClient: fakeClient,
      positionRepository: fakePositionRepository,
      tradingPairService: fakeTradingPairService,
    });

  const result =
    await service.reconcile();

  if (result.symbol !== 'BTCUSDT') {
    throw new Error('Symbol reconciliation failed');
  }

  if (!result.exchangeBalance) {
    throw new Error(
      'Exchange balance reconciliation failed'
    );
  }

  if (
    result.exchangeBalance.asset !== 'BTC'
  ) {
    throw new Error(
      'Base asset reconciliation failed'
    );
  }

  if (
    !Array.isArray(result.localPositions)
  ) {
    throw new Error(
      'Local positions reconciliation failed'
    );
  }

  console.log('Symbol reconciliation: OK');
  console.log('Exchange balance reconciliation: OK');
  console.log('Local position reconciliation: OK');
  console.log('Milestone 36: OK');
})();
