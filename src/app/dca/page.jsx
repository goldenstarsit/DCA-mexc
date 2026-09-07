'use client';

import { useEffect, useState } from 'react';

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

      const response = await fetch(
        '/api/dca/levels',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
    <main
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 20,
      }}
    >
      <h1>DCA Management</h1>

      <p style={{ marginTop: 8 }}>
        Manage DCA levels and their trigger quantities.
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

      <section style={{ marginTop: 24 }}>
        <h2>Add DCA Level</h2>

        <form
          onSubmit={addLevel}
          style={{
            display: 'grid',
            gap: 12,
            marginTop: 12,
          }}
        >
          <label>
            Trigger Drop %
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={triggerPercent}
              onChange={(e) =>
                setTriggerPercent(e.target.value)
              }
              style={{
                display: 'block',
                width: '100%',
                padding: 10,
                marginTop: 4,
              }}
            />
          </label>

          <label>
            Quantity
            <input
              type="number"
              step="0.000001"
              min="0"
              required
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              style={{
                display: 'block',
                width: '100%',
                padding: 10,
                marginTop: 4,
              }}
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) =>
                setEnabled(e.target.checked)
              }
            />{' '}
            Enabled
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: 12,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Add DCA Level'}
          </button>
        </form>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>DCA Levels</h2>

        {loading ? (
          <p>Loading...</p>
        ) : levels.length === 0 ? (
          <p>No DCA levels configured.</p>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              marginTop: 12,
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>
                    Level
                  </th>
                  <th style={{ textAlign: 'left', padding: 8 }}>
                    Trigger %
                  </th>
                  <th style={{ textAlign: 'left', padding: 8 }}>
                    Quantity
                  </th>
                  <th style={{ textAlign: 'left', padding: 8 }}>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {levels.map((level) => (
                  <tr key={level.id}>
                    <td style={{ padding: 8 }}>
                      DCA {level.level}
                    </td>

                    <td style={{ padding: 8 }}>
                      {level.trigger_percent}%
                    </td>

                    <td style={{ padding: 8 }}>
                      {level.quantity}
                    </td>

                    <td style={{ padding: 8 }}>
                      {level.enabled ? 'Enabled' : 'Disabled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
