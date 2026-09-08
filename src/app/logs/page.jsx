'use client';

import { useEffect, useState } from 'react';

function LevelBadge({ level }) {
  const type =
    level === 'ERROR'
      ? 'status-danger'
      : level === 'WARNING'
        ? 'status-warning'
        : 'status-success';

  return (
    <span className={`status-badge ${type}`}>
      {level}
    </span>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  async function loadLogs() {
    try {
      const response = await fetch(
        '/api/logs',
        { cache: 'no-store' }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || 'Logs API failed'
        );
      }

      setLogs(result.logs || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    let interval = null;

    const startPolling = () => {
      if (document.hidden || interval) {
        return;
      }

      loadLogs();

      interval = setInterval(
        loadLogs,
        5000
      );
    };

    const stopPolling = () => {
      if (!interval) {
        return;
      }

      clearInterval(interval);
      interval = null;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    startPolling();

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      stopPolling();

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Bot Event Logs
          </h1>

          <p className="page-description">
            Runtime events, warnings and errors.
          </p>
        </div>

        <span className="status-badge status-neutral">
          {logs.length} events
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
        {!error && logs.length === 0 ? (
          <div className="empty-state">
            No bot events yet.
          </div>
        ) : (
          <div className="table-container">
            <table>
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

                    <td>
                      <LevelBadge
                        level={log.level}
                      />
                    </td>

                    <td>
                      <strong>
                        {log.event_type}
                      </strong>
                    </td>

                    <td>
                      {log.symbol || '—'}
                    </td>

                    <td>
                      {log.message}
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
