import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function GET() {
  const [{ data: payments }, { data: payouts }] = await Promise.all([
    supabaseAdmin.from('payments').select('amount,status'),
    supabaseAdmin.from('payouts').select('amount,status'),
  ]);

  const paidIn = (payments ?? []).filter((x: any) => x.status === 'paid').reduce((a: number, x: any) => a + Number(x.amount ?? 0), 0);
  const paidOut = (payouts ?? []).filter((x: any) => x.status === 'paid').reduce((a: number, x: any) => a + Number(x.amount ?? 0), 0);

  return NextResponse.json({
    data: {
      paidIn,
      paidOut,
      balance: paidIn - paidOut,
    },
  });
}
