import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';
import { getSessionUser } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ error: 'listingId is required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('listing_id', listingId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { bookingId?: string; rating?: number; text?: string };
  if (!body.bookingId || !body.rating || !body.text) {
    return NextResponse.json({ error: 'bookingId, rating, text required' }, { status: 400 });
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id,guest_id,listing_id,status')
    .eq('id', body.bookingId)
    .eq('guest_id', user.id)
    .single();

  if (bookingError || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.status !== 'completed') return NextResponse.json({ error: 'Review allowed only for completed bookings' }, { status: 409 });

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      booking_id: booking.id,
      listing_id: booking.listing_id,
      author_id: user.id,
      rating: body.rating,
      text: body.text,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
