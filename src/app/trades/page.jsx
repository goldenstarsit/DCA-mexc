'use client';

import { useEffect, useState } from 'react';

export default function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState(null);

  async function loadTrades() {
    try {
      const response = await fetch(
        '/api/trades',
        { cache: 'no-store' }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || 'Trade history API failed'
        );
      }

      setTrades(result.trades || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTrades();

    const interval = setInterval(
      loadTrades,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  const totalPnl = trades.reduce(
    (sum, trade) =>
      sum + Number(trade.realized_pnl || 0),
    0
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Trade History
          </h1>

          <p className="page-description">
            Completed trades and realized performance.
          </p>
        </div>

        <span
          className={`status-badge ${
            totalPnl >= 0
              ? 'status-success'
              : 'status-danger'
          }`}
        >
          P&L: {totalPnl}
        </span>
      </div>

      {error && (
        <div
          className="message message-error"
          style={{ marginBottom: 16 }}
        >
          API Error: {error}
        </div>
      )}

      <div className="card table-card">
        {!error && trades.length === 0 ? (
          <div className="empty-state">
            No completed trades yet.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>P&L</th>
                  <th>P&L %</th>
                  <th>Closed</th>
                </tr>
              </thead>

              <tbody>
                {trades.map((trade) => {
                  const pnl =
                    Number(
                      trade.realized_pnl || 0
                    );

                  return (
                    <tr key={trade.id}>
                      <td>{trade.id}</td>

                      <td>
                        <strong>
                          {trade.symbol}
                        </strong>
                      </td>

                      <td>{trade.quantity}</td>

                      <td>
                        {trade.entry_price ?? '—'}
                      </td>

                      <td>
                        {trade.exit_price ??
                          trade.price}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            pnl >= 0
                              ? 'status-success'
                              : 'status-danger'
                          }`}
                        >
                          {trade.realized_pnl}
                        </span>
                      </td>

                      <td>
                        {trade.realized_pnl_percent}%
                      </td>

                      <td>
                        {trade.closed_at}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
