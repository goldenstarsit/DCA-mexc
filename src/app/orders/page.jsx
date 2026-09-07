'use client';

import { useEffect, useState } from 'react';

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
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 20,
      }}
    >
      <h1>Orders</h1>

      <p style={{ marginTop: 8 }}>
        Trading order requests and their exchange status.
      </p>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: '1px solid #c00',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ marginTop: 24 }}>
          Loading...
        </p>
      ) : orders.length === 0 ? (
        <p style={{ marginTop: 24 }}>
          No orders found.
        </p>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            marginTop: 24,
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: 900,
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>
                  ID
                </th>
                <th style={{ textAlign: 'left', padding: 8 }}>
                  Symbol
                </th>
                <th style={{ textAlign: 'left', padding: 8 }}>
                  Side
                </th>
                <th style={{ textAlign: 'left', padding: 8 }}>
                  Type
                </th>
                <th style={{ textAlign: 'left', padding: 8 }}>
                  Quantity
                </th>
                <th style={{ textAlign: 'left', padding: 8 }}>
                  Price
                </th>
                <th style={{ textAlign: 'left', padding: 8 }}>
                  Status
                </th>
                <th style={{ textAlign: 'left', padding: 8 }}>
                  Exchange ID
                </th>
                <th style={{ textAlign: 'left', padding: 8 }}>
                  Created
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ padding: 8 }}>
                    {order.id}
                  </td>

                  <td style={{ padding: 8 }}>
                    {order.symbol}
                  </td>

                  <td style={{ padding: 8 }}>
                    {order.side}
                  </td>

                  <td style={{ padding: 8 }}>
                    {order.type}
                  </td>

                  <td style={{ padding: 8 }}>
                    {order.quantity}
                  </td>

                  <td style={{ padding: 8 }}>
                    {order.price ?? '-'}
                  </td>

                  <td style={{ padding: 8 }}>
                    {order.status}
                  </td>

                  <td style={{ padding: 8 }}>
                    {order.exchange_order_id ?? '-'}
                  </td>

                  <td style={{ padding: 8 }}>
                    {order.created_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
