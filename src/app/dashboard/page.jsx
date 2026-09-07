'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function loadDashboard() {
    try {
      const response = await fetch(
        '/api/dashboard/status',
        { cache: 'no-store' }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || 'Dashboard API failed'
        );
      }

      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(
      loadDashboard,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <main style={{ padding: 20 }}>
        <h1>DCA-MEXC Dashboard</h1>
        <p>API Error: {error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ padding: 20 }}>
        <h1>DCA-MEXC Dashboard</h1>
        <p>Loading...</p>
      </main>
    );
  }

  const bot = data.bot;
  const position = data.position;
  const config = data.config;

  return (
    <main
      style={{
        padding: 20,
        maxWidth: 1000,
        margin: '0 auto',
      }}
    >
      <h1>DCA-MEXC Dashboard</h1>

      <section
        style={{
          display: 'grid',
          gap: 16,
          marginTop: 20,
        }}
      >
        <div>
          <strong>Bot Status</strong>
          <div>{bot.state}</div>
        </div>

        <div>
          <strong>Trading Pair</strong>
          <div>{data.pair || 'Not configured'}</div>
        </div>

        <div>
          <strong>Position</strong>

          {position ? (
            <div style={{ marginTop: 8 }}>
              <div>Symbol: {position.symbol}</div>
              <div>Quantity: {position.quantity}</div>
              <div>
                Invested: {position.investedAmount}
              </div>
              <div>
                Average Entry:{' '}
                {position.averageEntryPrice}
              </div>
              <div>
                Opened: {position.openedAt}
              </div>
            </div>
          ) : (
            <div>No open position</div>
          )}
        </div>

        <div>
          <strong>Risk Configuration</strong>

          <div style={{ marginTop: 8 }}>
            <div>
              Max Investment:{' '}
              {config.maxInvestment}
            </div>

            <div>
              Max Open Positions:{' '}
              {config.maxOpenPositions}
            </div>

            <div>
              Take Profit:{' '}
              {config.takeProfitPercent}%
            </div>

            <div>
              Stop Loss:{' '}
              {config.stopLossPercent}%
            </div>
          </div>
        </div>

        <div>
          <strong>Last Update</strong>
          <div>{data.timestamp}</div>
        </div>
      </section>
    </main>
  );
}
