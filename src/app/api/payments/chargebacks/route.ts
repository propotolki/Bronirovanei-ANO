import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json() as { paymentId?: string; reason?: string };
  if (!body.paymentId || !body.reason) {
    return NextResponse.json({ error: 'paymentId and reason are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('chargebacks')
    .insert({ payment_id: body.paymentId, reason: body.reason, status: 'open' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('id', body.paymentId);

  return NextResponse.json({ data }, { status: 201 });
}
