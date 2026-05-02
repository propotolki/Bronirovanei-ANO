import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { amount?: number; currency?: string };
  if (!body.amount || body.amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('payouts')
    .insert({
      host_id: user.id,
      amount: body.amount,
      currency: body.currency ?? 'RUB',
      status: 'requested',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
