import { beforeEach, describe, expect, it } from 'vitest';
import { emptyInvoiceData } from '@/lib/invoices/empty';
import { deleteTemplate, listTemplates, saveTemplate } from '@/lib/templates';
import { makeUser, resetDb } from './helpers/db';

describe('templates', () => {
  beforeEach(resetDb);

  it('are private to their owner', async () => {
    const a = await makeUser('a@example.com');
    const b = await makeUser('b@example.com');
    await saveTemplate(a.id, 'Retainer', { ...emptyInvoiceData(), invoiceNumber: 'T-1' });
    const [tpl] = await listTemplates(a.id);
    expect(tpl.name).toBe('Retainer');
    expect(await listTemplates(b.id)).toEqual([]);

    await deleteTemplate(b.id, tpl.id);
    expect(await listTemplates(a.id)).toHaveLength(1);
    await deleteTemplate(a.id, tpl.id);
    expect(await listTemplates(a.id)).toEqual([]);
  });
});
