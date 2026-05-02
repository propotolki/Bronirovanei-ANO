import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ error: 'listingId is required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('availability')
    .select('*')
    .eq('listing_id', listingId)
    .order('date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { listingId?: string; date?: string; isAvailable?: boolean; priceOverride?: number | null };
  if (!body.listingId || !body.date || typeof body.isAvailable !== 'boolean') {
    return NextResponse.json({ error: 'listingId, date, isAvailable are required' }, { status: 400 });
  }

  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('id,host_id')
    .eq('id', body.listingId)
    .eq('host_id', user.id)
    .single();

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from('availability')
    .upsert(
      {
        listing_id: body.listingId,
        date: body.date,
        is_available: body.isAvailable,
        price_override: body.priceOverride ?? null,
      },
      { onConflict: 'listing_id,date' }
    )
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
