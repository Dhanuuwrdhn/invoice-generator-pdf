import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { InvitationInsert } from '@/types/invitation';

function toSlug(bride: string, groom: string): string {
  const clean = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${clean(groom)}-${clean(bride)}-${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = toSlug(body.bride_name ?? '', body.groom_name ?? '');
    const payload: InvitationInsert = { ...body, slug };

    const { data, error } = await supabase
      .from('invitations')
      .insert(payload)
      .select('slug')
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ slug: data.slug });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
