import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: favorites } = await supabaseAdmin
    .from('favorites')
    .select('listings!inner(city)')
    .eq('user_id', user.id)
    .limit(20);

  const cities = [...new Set((favorites ?? []).map((f: any) => f.listings.city))];

  let query = supabaseAdmin.from('listings').select('*').eq('status', 'active').limit(50);
  if (cities.length > 0) query = query.in('city', cities);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, strategy: cities.length > 0 ? 'favorite-city' : 'fallback-active' });
}
