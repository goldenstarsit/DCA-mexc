'use client';

import { useEffect, useState } from 'react';

function StatusBadge({ enabled }) {
  return (
    <span
      className={`status-badge ${
        enabled
          ? 'status-success'
          : 'status-neutral'
      }`}
    >
      {enabled ? 'ENABLED' : 'DISABLED'}
    </span>
  );
}

export default function DcaManagementPage() {
  const [levels, setLevels] = useState([]);
  const [triggerPercent, setTriggerPercent] = useState('');
  const [quantity, setQuantity] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadLevels() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/api/dca/levels',
        { cache: 'no-store' }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || 'Failed to load DCA levels'
        );
      }

      setLevels(data.levels || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addLevel(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      const nextLevel =
        levels.length > 0
          ? Math.max(
              ...levels.map((item) =>
                Number(item.level)
              )
            ) + 1
          : 1;

      const response = await fetch(
        '/api/dca/levels',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            level: nextLevel,
            triggerPercent: Number(triggerPercent),
            quantity: Number(quantity),
            enabled,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || 'Failed to create DCA level'
        );
      }

      setTriggerPercent('');
      setQuantity('');
      setEnabled(true);

      await loadLevels();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadLevels();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            DCA Management
          </h1>

          <p className="page-description">
            Configure price-drop levels and investment quantities.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="message message-error"
          style={{ marginBottom: 16 }}
        >
          {error}
        </div>
      )}

      <section className="form-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Add DCA Level
            </h2>

            <div
              style={{
                marginTop: 4,
                color: 'var(--muted)',
                fontSize: 12,
              }}
            >
              Next level will be assigned automatically.
            </div>
          </div>

          <span className="status-badge status-neutral">
            DCA {levels.length + 1}
          </span>
        </div>

        <form
          onSubmit={addLevel}
          className="form-grid"
        >
          <div className="form-field">
            <label className="form-label">
              Trigger Drop %
            </label>

            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="e.g. 2.5"
              value={triggerPercent}
              onChange={(event) =>
                setTriggerPercent(
                  event.target.value
                )
              }
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Quantity
            </label>

            <input
              type="number"
              step="0.000001"
              min="0"
              required
              placeholder="e.g. 0.001"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target.value
                )
              }
            />
          </div>

          <div className="checkbox-field">
            <input
              id="dca-enabled"
              type="checkbox"
              checked={enabled}
              onChange={(event) =>
                setEnabled(
                  event.target.checked
                )
              }
            />

            <label
              htmlFor="dca-enabled"
              className="form-label"
            >
              Enable this level
            </label>
          </div>

          <div>
            <button
              type="submit"
              className="button button-primary"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Add DCA Level'}
            </button>
          </div>
        </form>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Configured Levels
            </h2>

            <div
              style={{
                marginTop: 4,
                color: 'var(--muted)',
                fontSize: 12,
              }}
            >
              {levels.length} level
              {levels.length === 1 ? '' : 's'} configured
            </div>
          </div>
        </div>

        <div className="card table-card">
          {loading ? (
            <div className="empty-state">
              Loading DCA levels...
            </div>
          ) : levels.length === 0 ? (
            <div className="empty-state">
              No DCA levels configured yet.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Trigger Drop</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {levels.map((level) => (
                    <tr key={level.id}>
                      <td>
                        <strong>
                          DCA {level.level}
                        </strong>
                      </td>

                      <td>
                        {level.trigger_percent}%
                      </td>

                      <td>
                        {level.quantity}
                      </td>

                      <td>
                        <StatusBadge
                          enabled={Boolean(
                            level.enabled
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
