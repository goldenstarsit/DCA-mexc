const Database = require('better-sqlite3');

const baseUrl = 'http://localhost:3000/api/dca/levels';

async function request(method, body) {
  const response = await fetch(baseUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `${method} failed: ${response.status} ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function main() {
  const testLevel =
    10000 + Math.floor(Math.random() * 90000);

  let created;

  try {
    created = await request('POST', {
      level: testLevel,
      triggerPercent: 5,
      quantity: 1,
      enabled: true,
    });

    if (
      !created.success ||
      created.level.level !== testLevel ||
      Number(created.level.enabled) !== 1
    ) {
      throw new Error('Initial enabled state failed');
    }

    const disabled = await request('PATCH', {
      level: testLevel,
      enabled: false,
    });

    if (
      !disabled.success ||
      Number(disabled.level.enabled) !== 0
    ) {
      throw new Error('DCA disable failed');
    }

    const levelsAfterDisable = await request('GET');

    const disabledLevel =
      levelsAfterDisable.levels.find(
        item => item.level === testLevel
      );

    if (
      !disabledLevel ||
      Number(disabledLevel.enabled) !== 0
    ) {
      throw new Error(
        'Disabled state was not persisted'
      );
    }

    const enabled = await request('PATCH', {
      level: testLevel,
      enabled: true,
    });

    if (
      !enabled.success ||
      Number(enabled.level.enabled) !== 1
    ) {
      throw new Error('DCA re-enable failed');
    }

    const levelsAfterEnable = await request('GET');

    const enabledLevel =
      levelsAfterEnable.levels.find(
        item => item.level === testLevel
      );

    if (
      !enabledLevel ||
      Number(enabledLevel.enabled) !== 1
    ) {
      throw new Error(
        'Enabled state was not persisted'
      );
    }

    console.log('DCA disable: OK');
    console.log('Disabled state persistence: OK');
    console.log('DCA re-enable: OK');
    console.log('Enabled state persistence: OK');
    console.log('Milestone 16: OK');
  } finally {
    if (created?.level?.level) {
      const db = new Database('./data/dca-mexc.db');

      db.prepare(`
        DELETE FROM dca_levels
        WHERE level = ?
      `).run(created.level.level);

      db.close();
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
