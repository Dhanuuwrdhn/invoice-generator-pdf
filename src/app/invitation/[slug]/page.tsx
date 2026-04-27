import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TemplateRenderer } from '@/components/invitation/TemplateRenderer';
import { Invitation } from '@/types/invitation';
import type { Metadata } from 'next';

interface Props { params: Promise<{ slug: string }> }

async function getInvitation(slug: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return data as Invitation;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const inv = await getInvitation(slug);
  if (!inv) return { title: 'Undangan tidak ditemukan' };
  return {
    title: `Undangan Pernikahan ${inv.groom_name} & ${inv.bride_name}`,
    description: `${inv.groom_name} & ${inv.bride_name} — ${inv.reception_date}`,
  };
}

export default async function InvitationPage({ params }: Props) {
  const { slug } = await params;
  const inv = await getInvitation(slug);
  if (!inv) notFound();
  return <TemplateRenderer inv={inv} />;
}
