import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function GET() {
  const { data: disputes, error } = await supabaseAdmin
    .from('disputes')
    .select('id,status,created_at')
    .eq('status', 'open');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const withAge = (disputes ?? []).map((d: any) => ({
    ...d,
    ageHours: Math.floor((now - new Date(d.created_at).getTime()) / 3600000),
  }));

  return NextResponse.json({
    data: {
      openDisputes: withAge.length,
      breached24h: withAge.filter((x: any) => x.ageHours > 24).length,
      breached72h: withAge.filter((x: any) => x.ageHours > 72).length,
      items: withAge,
    },
  });
}
