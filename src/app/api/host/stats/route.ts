import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: listings } = await supabaseAdmin.from('listings').select('id').eq('host_id', user.id);
  const listingIds = (listings ?? []).map((x: { id: string }) => x.id);

  if (listingIds.length === 0) {
    return NextResponse.json({ data: { listings: 0, bookings: 0, confirmedBookings: 0, revenue: 0 } });
  }

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('id,status,total_price')
    .in('listing_id', listingIds);

  const all = bookings ?? [];
  const confirmed = all.filter((b: { status: string }) => b.status === 'confirmed' || b.status === 'completed');
  const revenue = confirmed.reduce((acc: number, b: { total_price?: number | string }) => acc + Number(b.total_price ?? 0), 0);

  return NextResponse.json({
    data: {
      listings: listingIds.length,
      bookings: all.length,
      confirmedBookings: confirmed.length,
      revenue,
    },
  });
}
