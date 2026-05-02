import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  const user = await getSessionUser(_req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { bookingId } = await params;

  const { error } = await supabaseAdmin
    .from('messages')
    .update({ delivery_status: 'read', read_at: new Date().toISOString() })
    .eq('booking_id', bookingId)
    .eq('receiver_id', user.id)
    .neq('delivery_status', 'read');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
