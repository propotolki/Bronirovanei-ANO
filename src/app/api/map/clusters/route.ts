import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function GET(req: NextRequest) {
  const zoom = Number(req.nextUrl.searchParams.get('zoom') ?? 10);
  const precision = zoom >= 12 ? 2 : 1;

  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('id,title,lat,lng,price_per_night')
    .eq('status', 'active')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(1000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const buckets = new Map<string, { lat: number; lng: number; count: number; minPrice: number }>();

  (data ?? []).forEach((row: any) => {
    const keyLat = Number(row.lat).toFixed(precision);
    const keyLng = Number(row.lng).toFixed(precision);
    const key = `${keyLat}:${keyLng}`;
    const current = buckets.get(key);
    if (!current) {
      buckets.set(key, { lat: Number(keyLat), lng: Number(keyLng), count: 1, minPrice: Number(row.price_per_night) });
    } else {
      current.count += 1;
      current.minPrice = Math.min(current.minPrice, Number(row.price_per_night));
    }
  });

  return NextResponse.json({ data: Array.from(buckets.values()) });
}
