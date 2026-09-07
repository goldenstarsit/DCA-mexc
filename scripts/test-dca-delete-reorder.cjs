require('dotenv').config({ path: '.env.local' });

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
  const levels = [
    {
      level: 1,
      triggerPercent: 2,
      quantity: 1,
      enabled: true,
    },
    {
      level: 2,
      triggerPercent: 4,
      quantity: 2,
      enabled: true,
    },
    {
      level: 3,
      triggerPercent: 6,
      quantity: 3,
      enabled: true,
    },
  ];

  const created = [];

  try {
    for (const level of levels) {
      const result = await request('POST', level);

      if (!result.success) {
        throw new Error(`Failed to create level ${level.level}`);
      }

      created.push(level.level);
    }

    const reordered = await request('PUT', {
      levels: [3, 1, 2],
    });

    if (!reordered.success) {
      throw new Error('Reorder failed');
    }

    const resultLevels = reordered.levels;

    if (
      resultLevels.length !== 3 ||
      resultLevels[0].level !== 1 ||
      resultLevels[1].level !== 2 ||
      resultLevels[2].level !== 3
    ) {
      throw new Error('Reorder numbering failed');
    }

    if (
      Number(resultLevels[0].trigger_percent) !== 6 ||
      Number(resultLevels[0].quantity) !== 3 ||
      Number(resultLevels[1].trigger_percent) !== 2 ||
      Number(resultLevels[1].quantity) !== 1 ||
      Number(resultLevels[2].trigger_percent) !== 4 ||
      Number(resultLevels[2].quantity) !== 2
    ) {
      throw new Error('Reordered data was not preserved');
    }

    console.log('DCA reorder: OK');
    console.log('Reorder renumbering: OK');
    console.log('Reorder data persistence: OK');

    const deleted = await request('DELETE', {
      level: 2,
    });

    if (
      !deleted.success ||
      Number(deleted.deletedLevel) !== 2
    ) {
      throw new Error('DCA delete failed');
    }

    const afterDelete = await request('GET');

    if (
      afterDelete.levels.some(
        item => item.level === 2
      )
    ) {
      throw new Error('Deleted level still exists');
    }

    console.log('DCA delete: OK');
    console.log('Delete persistence: OK');
    console.log('Milestone 17: OK');
  } finally {
    const Database = require('better-sqlite3');

    const db = new Database('./data/dca-mexc.db');

    db.prepare(`
      DELETE FROM dca_levels
      WHERE level IN (1, 2, 3)
    `).run();

    db.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
