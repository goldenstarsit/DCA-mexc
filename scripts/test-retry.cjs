(async () => {
  const { withRetry } =
    await import(
      '../src/server/core/Retry.js'
    );

  let attempts = 0;

  const result = await withRetry(
    async () => {
      attempts += 1;

      if (attempts < 3) {
        throw new Error('TEMPORARY_ERROR');
      }

      return 'SUCCESS';
    },
    {
      retries: 3,
      delayMs: 10,
    }
  );

  if (result !== 'SUCCESS') {
    throw new Error(
      'Retry success test failed'
    );
  }

  if (attempts !== 3) {
    throw new Error(
      `Expected 3 attempts, got ${attempts}`
    );
  }

  let failedAttempts = 0;

  try {
    await withRetry(
      async () => {
        failedAttempts += 1;
        throw new Error('PERMANENT_ERROR');
      },
      {
        retries: 2,
        delayMs: 10,
      }
    );

    throw new Error(
      'Permanent error should have failed'
    );
  } catch (error) {
    if (
      error.message !== 'PERMANENT_ERROR'
    ) {
      throw error;
    }
  }

  if (failedAttempts !== 3) {
    throw new Error(
      `Expected 3 failed attempts, got ${failedAttempts}`
    );
  }

  console.log('Retry success: OK');
  console.log('Retry limit: OK');
  console.log('Milestone 37: OK');
})();
