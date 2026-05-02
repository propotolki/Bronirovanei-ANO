import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';
import { getSessionUser } from '@/lib/server/auth';
import { createNotification } from '@/lib/server/notifications';
import { logAudit } from '@/lib/server/audit';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status } = (await req.json()) as { status?: 'confirmed' | 'cancelled' };
  if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 });

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id,guest_id,listings!inner(host_id)')
    .eq('id', id)
    .eq('listings.host_id', user.id)
    .single();

  if (bookingError || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createNotification(booking.guest_id, 'Статус бронирования обновлен', `Ваше бронирование ${status}.`);
  await logAudit(user.id, 'booking.status.update', 'booking', id, { status });

  return NextResponse.json({ data });
}
