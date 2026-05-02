import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';
import { checkRateLimit, sanitizeText } from '@/lib/server/security';

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { targetType?: string; targetId?: string; reason?: string; details?: string };
  if (!body.targetType || !body.targetId || !body.reason) {
    return NextResponse.json({ error: 'targetType, targetId, reason required' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('reports')
    .insert({
      reporter_id: user.id,
      target_type: body.targetType,
      target_id: body.targetId,
      reason: sanitizeText(body.reason, 300),
      details: body.details ? sanitizeText(body.details, 1000) : null,
    })
    .select('*')
    .single();

  if (error || !report) return NextResponse.json({ error: error?.message ?? 'Failed to create report' }, { status: 500 });

  await supabaseAdmin.from('disputes').insert({
    report_id: report.id,
    status: 'open',
  });

  return NextResponse.json({ ok: true, report }, { status: 201 });
}
