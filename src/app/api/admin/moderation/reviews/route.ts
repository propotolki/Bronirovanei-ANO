import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';
import { getSessionUser } from '@/lib/server/auth';
import { logAudit } from '@/lib/server/audit';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { reviewId, status } = await req.json() as { reviewId?: string; status?: 'published' | 'rejected' };
  if (!reviewId || !status) return NextResponse.json({ error: 'reviewId and status required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update({ status })
    .eq('id', reviewId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
