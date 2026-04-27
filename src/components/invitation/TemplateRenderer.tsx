'use client';

import { Invitation } from '@/types/invitation';
import { ElegantTemplate } from './ElegantTemplate';
import { FloralTemplate } from './FloralTemplate';
import { ModernTemplate } from './ModernTemplate';

export function TemplateRenderer({ inv }: { inv: Invitation }) {
  switch (inv.template_id) {
    case 'floral':  return <FloralTemplate inv={inv} />;
    case 'modern':  return <ModernTemplate inv={inv} />;
    default:        return <ElegantTemplate inv={inv} />;
  }
}
