export class RestartRecoveryService {
  constructor({
    botRuntimeRepository,
    positionRepository,
    orderRequestRepository,
  }) {
    this.botRuntimeRepository = botRuntimeRepository;
    this.positionRepository = positionRepository;
    this.orderRequestRepository = orderRequestRepository;
  }

  recover() {
    const runtime =
      this.botRuntimeRepository.get();

    const openPositions =
      this.positionRepository.getAllOpen();

    const orders =
      this.orderRequestRepository.getAll();

    const processingOrders =
      orders.filter(
        (order) => order.status === 'PROCESSING'
      );

    return {
      state: runtime?.state ?? 'STOPPED',
      updatedAt: runtime?.updated_at ?? null,
      openPositions,
      processingOrders,
      recoveredAt: new Date().toISOString(),
    };
  }
}
