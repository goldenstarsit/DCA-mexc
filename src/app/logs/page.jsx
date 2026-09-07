'use client';

import { useEffect, useState } from 'react';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  async function loadLogs() {
    try {
      const response = await fetch('/api/logs', {
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || 'Logs API failed'
        );
      }

      setLogs(result.logs);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadLogs();

    const interval = setInterval(loadLogs, 5000);

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
      <h1>Bot Event Logs</h1>

      {error && <p>API Error: {error}</p>}

      {!error && logs.length === 0 && (
        <p>No bot events yet.</p>
      )}

      {logs.length > 0 && (
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
                <th>Time</th>
                <th>Level</th>
                <th>Event</th>
                <th>Symbol</th>
                <th>Message</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.created_at}</td>
                  <td>{log.level}</td>
                  <td>{log.event_type}</td>
                  <td>{log.symbol || '-'}</td>
                  <td>{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
