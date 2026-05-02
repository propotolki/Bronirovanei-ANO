import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';
import { listingSearchSchema } from '@/lib/server/schemas';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = listingSearchSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { city, minPrice, maxPrice } = parsed.data;

  let query = supabaseAdmin
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .limit(100);

  if (city) query = query.ilike('city', `%${city}%`);
  if (typeof minPrice === 'number') query = query.gte('price_per_night', minPrice);
  if (typeof maxPrice === 'number') query = query.lte('price_per_night', maxPrice);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
