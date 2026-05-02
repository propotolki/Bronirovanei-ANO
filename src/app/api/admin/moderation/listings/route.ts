import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('*')
    .in('status', ['pending', 'blocked'])
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { listingId, status } = body as { listingId?: string; status?: 'active' | 'blocked' | 'pending' };

  if (!listingId || !status) {
    return NextResponse.json({ error: 'listingId and status are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('listings')
    .update({ status })
    .eq('id', listingId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
