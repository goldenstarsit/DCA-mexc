'use client';

import { useEffect, useState } from 'react';

function StatusBadge({ status }) {
  const type =
    status === 'COMPLETED'
      ? 'status-success'
      : status === 'FAILED'
        ? 'status-danger'
        : status === 'PROCESSING'
          ? 'status-warning'
          : 'status-neutral';

  return (
    <span className={`status-badge ${type}`}>
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadOrders() {
    try {
      const response = await fetch(
        '/api/orders',
        { cache: 'no-store' }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || 'Failed to load orders'
        );
      }

      setOrders(data.orders || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const interval = setInterval(
      loadOrders,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Orders
          </h1>

          <p className="page-description">
            Trading requests and exchange execution status.
          </p>
        </div>

        <span className="status-badge status-neutral">
          {orders.length} orders
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
        {loading ? (
          <div className="empty-state">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            No orders found.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Exchange ID</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>

                    <td>
                      <strong>
                        {order.symbol}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          order.side === 'BUY'
                            ? 'status-success'
                            : 'status-danger'
                        }`}
                      >
                        {order.side}
                      </span>
                    </td>

                    <td>{order.type}</td>

                    <td>{order.quantity}</td>

                    <td>
                      {order.price ?? 'MARKET'}
                    </td>

                    <td>
                      <StatusBadge
                        status={order.status}
                      />
                    </td>

                    <td>
                      {order.exchange_order_id ?? '—'}
                    </td>

                    <td>
                      {order.created_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
