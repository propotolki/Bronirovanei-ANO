import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { bookingId } = await params;
  const { messageId, status } = await req.json() as { messageId?: string; status?: 'sent' | 'delivered' | 'read' };
  if (!messageId || !status) return NextResponse.json({ error: 'messageId and status required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({ delivery_status: status })
    .eq('id', messageId)
    .eq('booking_id', bookingId)
    .eq('receiver_id', user.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
