export async function withRetry(
  operation,
  {
    retries = 3,
    delayMs = 500,
    factor = 2,
    shouldRetry = () => true,
  } = {}
) {
  if (typeof operation !== 'function') {
    throw new TypeError(
      'operation must be a function'
    );
  }

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      if (
        attempt >= retries ||
        !shouldRetry(error, attempt)
      ) {
        throw error;
      }

      const delay =
        delayMs * Math.pow(factor, attempt);

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );

      attempt += 1;
    }
  }

  throw lastError;
}
