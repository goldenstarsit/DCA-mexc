'use client';

import { useEffect, useState } from 'react';

export default function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState(null);

  async function loadTrades() {
    try {
      const response = await fetch('/api/trades', {
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || 'Trade history API failed'
        );
      }

      setTrades(result.trades);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTrades();

    const interval = setInterval(loadTrades, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main
      style={{
        padding: 20,
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <h1>Trade History</h1>

      {error && <p>API Error: {error}</p>}

      {!error && trades.length === 0 && (
        <p>No completed trades yet.</p>
      )}

      {trades.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 20 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
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
              {trades.map((trade) => (
                <tr key={trade.id}>
                  <td>{trade.id}</td>
                  <td>{trade.symbol}</td>
                  <td>{trade.quantity}</td>
                  <td>{trade.entry_price ?? '-'}</td>
                  <td>{trade.exit_price ?? trade.price}</td>
                  <td>{trade.realized_pnl}</td>
                  <td>{trade.realized_pnl_percent}%</td>
                  <td>{trade.closed_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
