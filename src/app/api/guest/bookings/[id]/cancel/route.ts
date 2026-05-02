import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';
import { createNotification } from '@/lib/server/notifications';
import { logAudit } from '@/lib/server/audit';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id,guest_id,status,listings!inner(host_id)')
    .eq('id', id)
    .eq('guest_id', user.id)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return NextResponse.json({ error: 'Booking cannot be cancelled in current status' }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hostId = (booking as any).listings.host_id as string;
  await createNotification(hostId, 'Бронирование отменено', 'Гость отменил бронирование.');
  await logAudit(user.id, 'booking.cancel', 'booking', id, { reason: 'guest_cancel' });

  return NextResponse.json({ data });
}
