function getSafeErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
}

export function logServerError(event, error) {
  console.error(event, getSafeErrorMessage(error));
}
