import { describe, expect, it } from 'vitest';
import { isPaidEdit, nextPaidEdit } from '@/lib/invoices/rules';

describe('edit pricing', () => {
  it('charges every sixth edit only', () => {
    const paid = Array.from({ length: 19 }, (_, i) => i).filter(isPaidEdit);
    expect(paid).toEqual([6, 12, 18]);
  });

  it('reports the next paid edit number', () => {
    expect(nextPaidEdit(0)).toBe(6);
    expect(nextPaidEdit(5)).toBe(6);
    expect(nextPaidEdit(6)).toBe(12);
    expect(nextPaidEdit(11)).toBe(12);
  });
});
