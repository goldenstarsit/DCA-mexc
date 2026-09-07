'use client';

import { useEffect, useState } from 'react';

export default function DcaQuantityInput({
  value,
  onChange,
  symbolInfo,
}) {
  const [quantity, setQuantity] = useState(value ?? '');

  useEffect(() => {
    setQuantity(value ?? '');
  }, [value]);

  const minQuantity = symbolInfo?.minQuantity ?? '';
  const stepSize = symbolInfo?.stepSize ?? '';
  const precision = symbolInfo?.quantityPrecision ?? 8;

  function handleChange(event) {
    const nextValue = event.target.value;

    setQuantity(nextValue);
    onChange?.(nextValue);
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label htmlFor="dca-quantity">
        DCA Quantity
      </label>

      <input
        id="dca-quantity"
        type="number"
        inputMode="decimal"
        min={minQuantity || undefined}
        step={stepSize || 'any'}
        placeholder={
          minQuantity
            ? `Minimum: ${minQuantity}`
            : 'Enter quantity'
        }
        value={quantity}
        onChange={handleChange}
      />

      {symbolInfo && (
        <small>
          Min: {minQuantity || 'N/A'}{' '}
          | Step: {stepSize || 'N/A'}{' '}
          | Precision: {precision}
        </small>
      )}
    </div>
  );
}
