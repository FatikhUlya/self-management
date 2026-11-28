'use client';

import React from 'react';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string | number | undefined | null;
  /** Receives digits only in e.target.value ("Rp150.000" → "150000"). */
  onChange?: (e: { target: { value: string }; currentTarget: { value: string } }) => void;
};

/**
 * Rupiah amount field. A plain number input rejects pasted text like
 * "Rp150.000" on iOS and reads "150.000" as 150, so this is a text field with
 * the numeric keypad that keeps digits only and shows thousand separators.
 */
export function MoneyInput({ value, onChange, className, ...rest }: Props) {
  const digits = String(value ?? '').replace(/\D/g, '');
  const shown = digits ? Number(digits).toLocaleString('id-ID') : '';
  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={className}
      value={shown}
      onChange={(e) => {
        const d = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
        onChange?.({ target: { value: d }, currentTarget: { value: d } });
      }}
    />
  );
}
