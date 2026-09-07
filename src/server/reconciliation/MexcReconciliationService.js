export class MexcReconciliationService {
  constructor({
    mexcClient,
    positionRepository,
    tradingPairService,
  }) {
    this.mexcClient = mexcClient;
    this.positionRepository = positionRepository;
    this.tradingPairService = tradingPairService;
  }

  async reconcile() {
    const pairConfig =
      this.tradingPairService.get();

    const symbol =
      pairConfig?.symbol ?? null;

    const localPositions =
      this.positionRepository.getAllOpen();

    const account =
      await this.mexcClient.account();

    const balances =
      Array.isArray(account?.balances)
        ? account.balances
        : [];

    const baseAsset =
      symbol
        ? symbol.replace(/USDT$/i, '')
        : null;

    const exchangeBalance =
      balances.find(
        (item) =>
          item.asset?.toUpperCase() ===
          baseAsset?.toUpperCase()
      ) ?? null;

    return {
      symbol,
      localPositions,
      exchangeBalance,
      account,
      reconciledAt: new Date().toISOString(),
    };
  }
}
