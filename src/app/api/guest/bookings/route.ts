import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';
import { getSessionUser } from '@/lib/server/auth';
import { createBookingSchema } from '@/lib/server/schemas';

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = createBookingSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { listingId, dateFrom, dateTo } = parsed.data;

  const { data: listing, error: listingError } = await supabaseAdmin
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .eq('status', 'active')
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found or unavailable.' }, { status: 404 });
  }

  const { data: overlaps, error: overlapError } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('listing_id', listingId)
    .in('status', ['pending', 'confirmed'])
    .lte('date_from', dateTo)
    .gte('date_to', dateFrom)
    .limit(1);

  if (overlapError) return NextResponse.json({ error: overlapError.message }, { status: 500 });
  if (overlaps && overlaps.length > 0) {
    return NextResponse.json({ error: 'Selected dates are not available.' }, { status: 409 });
  }

  const days = Math.max(1, Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000) + 1);
  const totalPrice = Number(listing.price_per_night) * days;

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .insert({
      listing_id: listingId,
      guest_id: user.id,
      date_from: dateFrom,
      date_to: dateTo,
      total_price: totalPrice,
      status: 'pending',
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    .select('*')
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: bookingError?.message ?? 'Failed to create booking' }, { status: 500 });
  }

  await supabaseAdmin.from('payments').insert({
    booking_id: booking.id,
    amount: totalPrice,
    status: 'created',
    provider: 'vkpay',
  });

  return NextResponse.json({ data: booking, paymentStatus: 'created' }, { status: 201 });
}
