import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId, eventType } = await req.json() as { listingId?: string; eventType?: 'view' | 'favorite' | 'booking_intent' };
  if (!listingId || !eventType) return NextResponse.json({ error: 'listingId and eventType required' }, { status: 400 });

  const incrementField = eventType === 'view' ? 'views' : eventType === 'favorite' ? 'favorites' : 'booking_intents';

  const { data: existing } = await supabaseAdmin.from('listing_metrics').select('*').eq('listing_id', listingId).single();

  if (!existing) {
    const payload = {
      listing_id: listingId,
      views: eventType === 'view' ? 1 : 0,
      favorites: eventType === 'favorite' ? 1 : 0,
      booking_intents: eventType === 'booking_intent' ? 1 : 0,
    };
    await supabaseAdmin.from('listing_metrics').insert(payload);
  } else {
    await supabaseAdmin
      .from('listing_metrics')
      .update({ [incrementField]: Number((existing as any)[incrementField] ?? 0) + 1 })
      .eq('listing_id', listingId);
  }

  return NextResponse.json({ ok: true });
}
