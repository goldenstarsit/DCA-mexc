require('dotenv').config({ path: '.env.local' });

(async () => {
  const { getDatabase } = await import('../src/server/database/index.js');
  const { Transaction } = await import(
    '../src/server/database/core/Transaction.js'
  );

  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS transaction_test (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      value TEXT NOT NULL
    );

    DELETE FROM transaction_test;
  `);

  const transaction = new Transaction(db);

  transaction.run(() => {
    db.prepare(`
      INSERT INTO transaction_test (value)
      VALUES (?)
    `).run('COMMITTED');

    const inside = db.prepare(`
      SELECT COUNT(*) AS count
      FROM transaction_test
      WHERE value = 'COMMITTED'
    `).get();

    if (inside.count !== 1) {
      throw new Error(
        `Insert inside transaction failed: ${inside.count}`
      );
    }
  });

  const committed = db.prepare(`
    SELECT COUNT(*) AS count
    FROM transaction_test
    WHERE value = 'COMMITTED'
  `).get();

  console.log(
    'Committed rows:',
    committed.count
  );

  if (committed.count !== 1) {
    throw new Error('Commit transaction test failed');
  }

  try {
    transaction.run(() => {
      db.prepare(`
        INSERT INTO transaction_test (value)
        VALUES (?)
      `).run('ROLLBACK');

      throw new Error('FORCED_ROLLBACK');
    });
  } catch (error) {
    if (error.message !== 'FORCED_ROLLBACK') {
      throw error;
    }
  }

  const rolledBack = db.prepare(`
    SELECT COUNT(*) AS count
    FROM transaction_test
    WHERE value = 'ROLLBACK'
  `).get();

  console.log(
    'Rolled-back rows:',
    rolledBack.count
  );

  if (rolledBack.count !== 0) {
    throw new Error('Rollback transaction test failed');
  }

  db.exec(`
    DROP TABLE transaction_test
  `);

  console.log('Transaction commit: OK');
  console.log('Transaction rollback: OK');
  console.log('Milestone 34: OK');
})();
