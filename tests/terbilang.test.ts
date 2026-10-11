import { describe, expect, it } from 'vitest';
import { calcSubtotal, calcTax, calcTotal } from '@/lib/format';
import { numberToWords } from '@/lib/terbilang';

describe('numberToWords', () => {
  it.each([
    [0, 'Nol Rupiah'],
    [1, 'Satu Rupiah'],
    [11, 'Sebelas Rupiah'],
    [100, 'Seratus Rupiah'],
    [1000, 'Seribu Rupiah'],
    [1100, 'Seribu Seratus Rupiah'],
    [100_000, 'Seratus Ribu Rupiah'],
    [1_000_000, 'Satu Juta Rupiah'],
    [1_001_000, 'Satu Juta Seribu Rupiah'],
    [1_000_000_000, 'Satu Miliar Rupiah'],
    [100_000_000_000, 'Seratus Miliar Rupiah'],
    [1_000_000_000_000, 'Satu Triliun Rupiah'],
    [
      1_234_567_890_123,
      'Satu Triliun Dua Ratus Tiga Puluh Empat Miliar Lima Ratus Enam Puluh Tujuh Juta ' +
        'Delapan Ratus Sembilan Puluh Ribu Seratus Dua Puluh Tiga Rupiah',
    ],
    [1e15, 'Satu Kuadriliun Rupiah'],
    [1e18, 'Satu Kuintiliun Rupiah'],
  ])('%d → %s', (n, words) => {
    expect(numberToWords(n)).toBe(words);
  });

  it('handles the largest total the validation allows', () => {
    // 100 items × qty 1e6 × price 1e13, no discount, 100% tax (src/lib/validation.ts).
    const subtotal = calcSubtotal(Array.from({ length: 100 }, () => ({ qty: 1e6, price: 1e13 })));
    const total = calcTotal(subtotal, 0, calcTax(subtotal, 0, 100));
    expect(total).toBe(2e21);
    expect(numberToWords(total)).toBe('Dua Sekstiliun Rupiah');
    expect(numberToWords(1.5e21)).toBe('Satu Sekstiliun Lima Ratus Kuintiliun Rupiah');
  });

  it('rounds to whole rupiah like formatCurrency', () => {
    expect(numberToWords(1000.4)).toBe('Seribu Rupiah');
    expect(numberToWords(1000.5)).toBe('Seribu Satu Rupiah');
    expect(numberToWords(0.4)).toBe('Nol Rupiah');
  });

  it('prefixes negative totals (discount above subtotal) with Minus', () => {
    expect(numberToWords(-1500)).toBe('Minus Seribu Lima Ratus Rupiah');
    expect(numberToWords(-0.4)).toBe('Nol Rupiah');
  });

  it('rejects values it cannot spell', () => {
    expect(() => numberToWords(Number.NaN)).toThrow(RangeError);
    expect(() => numberToWords(Infinity)).toThrow(RangeError);
    expect(() => numberToWords(1e24)).toThrow(RangeError);
  });
});
