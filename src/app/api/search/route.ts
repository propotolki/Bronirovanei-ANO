import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

type ListingRow = {
  id: string;
  title: string;
  city: string;
  price_per_night: number;
  created_at: string;
};

function scoreListing(item: ListingRow, q: string, metrics: { views: number; favorites: number; booking_intents: number } | undefined) {
  const query = q.toLowerCase();
  let score = 0;
  if (item.title.toLowerCase().includes(query)) score += 5;
  if (item.city.toLowerCase().includes(query)) score += 3;
  score += Math.max(0, 2 - Number(item.price_per_night) / 10000);
  if (metrics) {
    score += Math.min(3, metrics.views / 100);
    score += Math.min(5, metrics.favorites / 20);
    score += Math.min(7, metrics.booking_intents / 10);
  }
  return score;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const city = params.get('city');
  const q = params.get('q') ?? '';
  const minPrice = Number(params.get('minPrice') ?? 0);
  const maxPrice = Number(params.get('maxPrice') ?? 1_000_000);
  const sort = params.get('sort') ?? 'recommended';

  let query = supabaseAdmin
    .from('listings')
    .select('id,title,city,price_per_night,status,created_at')
    .eq('status', 'active')
    .gte('price_per_night', minPrice)
    .lte('price_per_night', maxPrice)
    .limit(300);

  if (city) query = query.ilike('city', `%${city}%`);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = (data ?? []) as ListingRow[];

  const { data: metricsRows } = await supabaseAdmin.from('listing_metrics').select('listing_id,views,favorites,booking_intents');
  const metricsMap = new Map<string, { views: number; favorites: number; booking_intents: number }>((metricsRows ?? []).map((m: any) => [m.listing_id, { views: Number(m.views ?? 0), favorites: Number(m.favorites ?? 0), booking_intents: Number(m.booking_intents ?? 0) }]));

  if (sort === 'recommended') {
    const ranked = list
      .map((item) => ({ ...item, rank: scoreListing(item, q || item.city, metricsMap.get(item.id)) }))
      .sort((a, b) => b.rank - a.rank);
    return NextResponse.json({ data: ranked });
  }

  if (sort === 'price_asc') list.sort((a, b) => Number(a.price_per_night) - Number(b.price_per_night));
  if (sort === 'price_desc') list.sort((a, b) => Number(b.price_per_night) - Number(a.price_per_night));

  return NextResponse.json({ data: list });
}
