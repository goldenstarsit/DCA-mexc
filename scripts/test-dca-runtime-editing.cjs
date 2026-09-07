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
      triggerPercent: 2,
      quantity: 1,
      enabled: true,
    });

    if (
      !created.success ||
      created.level.level !== testLevel
    ) {
      throw new Error('DCA level creation failed');
    }

    const triggerUpdated = await request('PATCH', {
      level: testLevel,
      triggerPercent: 5,
    });

    if (
      !triggerUpdated.success ||
      Number(triggerUpdated.level.trigger_percent) !== 5
    ) {
      throw new Error('Trigger percentage editing failed');
    }

    const quantityUpdated = await request('PATCH', {
      level: testLevel,
      quantity: 3,
    });

    if (
      !quantityUpdated.success ||
      Number(quantityUpdated.level.quantity) !== 3
    ) {
      throw new Error('Quantity editing failed');
    }

    const enabledUpdated = await request('PATCH', {
      level: testLevel,
      enabled: false,
    });

    if (
      !enabledUpdated.success ||
      Number(enabledUpdated.level.enabled) !== 0
    ) {
      throw new Error('Enabled status editing failed');
    }

    const levels = await request('GET');

    const saved = levels.levels.find(
      item => item.level === testLevel
    );

    if (!saved) {
      throw new Error('Edited DCA level was not persisted');
    }

    if (
      Number(saved.trigger_percent) !== 5 ||
      Number(saved.quantity) !== 3 ||
      Number(saved.enabled) !== 0
    ) {
      throw new Error('Edited DCA values were not persisted correctly');
    }

    console.log('Runtime trigger editing: OK');
    console.log('Runtime quantity editing: OK');
    console.log('Runtime enabled editing: OK');
    console.log('Runtime edit persistence: OK');
    console.log('Milestone 15: OK');
  } finally {
    if (created?.level?.level) {
      // Milestone 17 has not introduced the delete API yet,
      // so cleanup is done directly through the database.
      const Database = require('better-sqlite3');
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
