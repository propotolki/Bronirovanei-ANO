import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function POST() {
  const { data: events, error } = await supabaseAdmin
    .from('event_outbox')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const event of events ?? []) {
    await supabaseAdmin.from('event_outbox').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', event.id);
  }

  return NextResponse.json({ processed: (events ?? []).length });
}
