export function validateDcaQuantity(quantity, symbolInfo) {
  const value = Number(quantity);

  if (!Number.isFinite(value) || value <= 0) {
    return {
      valid: false,
      error: 'Quantity must be greater than 0',
    };
  }

  if (!symbolInfo) {
    return {
      valid: false,
      error: 'MEXC symbol information is unavailable',
    };
  }

  if (
    symbolInfo.minQuantity != null &&
    value < Number(symbolInfo.minQuantity)
  ) {
    return {
      valid: false,
      error: `Minimum quantity is ${symbolInfo.minQuantity}`,
    };
  }

  if (
    symbolInfo.stepSize != null &&
    Number(symbolInfo.stepSize) > 0
  ) {
    const step = Number(symbolInfo.stepSize);
    const quotient = value / step;

    if (
      Math.abs(quotient - Math.round(quotient)) > 1e-9
    ) {
      return {
        valid: false,
        error: `Quantity must match step size ${symbolInfo.stepSize}`,
      };
    }
  }

  return {
    valid: true,
    error: null,
  };
}
