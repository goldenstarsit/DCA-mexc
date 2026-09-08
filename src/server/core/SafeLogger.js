function getSafeErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
}

function write(level, event, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    ...meta,
  };

  console[level === 'ERROR' ? 'error' : 'log'](
    JSON.stringify(entry)
  );
}

export function logServerInfo(
  event,
  message,
  meta = {}
) {
  write('INFO', event, message, meta);
}

export function logServerWarning(
  event,
  message,
  meta = {}
) {
  write('WARNING', event, message, meta);
}

export function logServerError(
  event,
  error,
  meta = {}
) {
  write(
    'ERROR',
    event,
    getSafeErrorMessage(error),
    meta
  );
}
