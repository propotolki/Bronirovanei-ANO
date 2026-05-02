import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('favorites')
    .select('id, listing_id, listings(id,title,city,price_per_night)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId } = await req.json() as { listingId?: string };
  if (!listingId) return NextResponse.json({ error: 'listingId is required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('favorites')
    .upsert({ user_id: user.id, listing_id: listingId }, { onConflict: 'user_id,listing_id' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const listingId = req.nextUrl.searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ error: 'listingId is required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
