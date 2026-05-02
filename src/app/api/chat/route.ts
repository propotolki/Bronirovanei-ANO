import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';
import { checkRateLimit, sanitizeText } from '@/lib/server/security';
import { getSessionUser } from '@/lib/server/auth';
import { createNotification } from '@/lib/server/notifications';

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId, receiverId, body } = (await req.json()) as { bookingId?: string; receiverId?: string; body?: string };
  if (!bookingId || !receiverId || !body) {
    return NextResponse.json({ error: 'bookingId, receiverId, body required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({ booking_id: bookingId, sender_id: user.id, receiver_id: receiverId, body: sanitizeText(body), delivery_status: 'sent' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createNotification(receiverId, 'Новое сообщение', 'У вас новое сообщение по бронированию.');

  return NextResponse.json({ data }, { status: 201 });
}
