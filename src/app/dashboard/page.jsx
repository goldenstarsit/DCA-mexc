'use client';

import { useEffect, useState } from 'react';

function StatusBadge({ state }) {
  const type =
    state === 'RUNNING'
      ? 'status-success'
      : state === 'PAUSED'
        ? 'status-warning'
        : 'status-neutral';

  return (
    <span className={`status-badge ${type}`}>
      {state}
    </span>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <div className="card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {detail && (
        <div
          style={{
            marginTop: 6,
            color: 'var(--muted)',
            fontSize: 11,
          }}
        >
          {detail}
        </div>
      )}
    </div>
  );
}

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
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-description">
              DCA-MEXC trading terminal
            </p>
          </div>
        </div>

        <div className="message message-error">
          API Error: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-description">
              DCA-MEXC trading terminal
            </p>
          </div>
        </div>

        <div className="card">
          <div className="loading">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  const bot = data.bot;
  const position = data.position;
  const config = data.config;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Trading Dashboard
          </h1>
          <p className="page-description">
            Monitor bot status, position and risk configuration.
          </p>
        </div>

        <StatusBadge state={bot.state} />
      </div>

      <section className="card-grid">
        <MetricCard
          label="BOT STATUS"
          value={bot.state}
          detail="Current runtime state"
        />

        <MetricCard
          label="TRADING PAIR"
          value={data.pair || '—'}
          detail="Configured market"
        />

        <MetricCard
          label="OPEN POSITION"
          value={position ? 'ACTIVE' : 'NONE'}
          detail={
            position
              ? `${position.quantity} units`
              : 'No active position'
          }
        />

        <MetricCard
          label="MAX INVESTMENT"
          value={config.maxInvestment}
          detail="Configured limit"
        />
      </section>

      <section className="section">
        <div className="card-grid">
          <div className="card">
            <div className="section-header">
              <h2 className="section-title">
                Open Position
              </h2>

              {position ? (
                <span className="status-badge status-success">
                  OPEN
                </span>
              ) : (
                <span className="status-badge status-neutral">
                  NONE
                </span>
              )}
            </div>

            {position ? (
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div>
                  <div className="metric-label">
                    Symbol
                  </div>
                  <strong>{position.symbol}</strong>
                </div>

                <div>
                  <div className="metric-label">
                    Quantity
                  </div>
                  <strong>{position.quantity}</strong>
                </div>

                <div>
                  <div className="metric-label">
                    Invested Amount
                  </div>
                  <strong>
                    {position.investedAmount}
                  </strong>
                </div>

                <div>
                  <div className="metric-label">
                    Average Entry Price
                  </div>
                  <strong>
                    {position.averageEntryPrice}
                  </strong>
                </div>

                <div>
                  <div className="metric-label">
                    Opened At
                  </div>
                  <span
                    style={{
                      color: 'var(--muted)',
                      fontSize: 12,
                    }}
                  >
                    {position.openedAt}
                  </span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                No open position.
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-header">
              <h2 className="section-title">
                Risk Configuration
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 14,
              }}
            >
              <div>
                <div className="metric-label">
                  Maximum Investment
                </div>
                <strong>
                  {config.maxInvestment}
                </strong>
              </div>

              <div>
                <div className="metric-label">
                  Maximum Open Positions
                </div>
                <strong>
                  {config.maxOpenPositions}
                </strong>
              </div>

              <div>
                <div className="metric-label">
                  Take Profit
                </div>
                <strong>
                  {config.takeProfitPercent}%
                </strong>
              </div>

              <div>
                <div className="metric-label">
                  Stop Loss
                </div>
                <strong>
                  {config.stopLossPercent}%
                </strong>
              </div>

              <div>
                <div className="metric-label">
                  Initial Entry
                </div>

                <span
                  className={`status-badge ${
                    config.initialEntryEnabled
                      ? 'status-success'
                      : 'status-neutral'
                  }`}
                >
                  {config.initialEntryEnabled
                    ? 'ENABLED'
                    : 'DISABLED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">
              System Information
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 8,
              color: 'var(--muted)',
              fontSize: 12,
            }}
          >
            <div>
              Last update:{' '}
              <strong style={{ color: 'var(--foreground)' }}>
                {data.timestamp}
              </strong>
            </div>

            <div>
              Dashboard refresh interval: 5 seconds
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
