import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function POST() {
  const now = new Date().toISOString();

  const { data: expired, error } = await supabaseAdmin
    .from('bookings')
    .select('id,status')
    .eq('status', 'pending')
    .lt('expires_at', now)
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (expired ?? []).map((b: any) => b.id);
  if (ids.length === 0) return NextResponse.json({ processed: 0 });

  await supabaseAdmin.from('bookings').update({ status: 'cancelled' }).in('id', ids);

  return NextResponse.json({ processed: ids.length });
}
