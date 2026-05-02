import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ids } = await req.json() as { ids?: string[] };
  if (!ids || ids.length === 0) return NextResponse.json({ error: 'ids are required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ status: 'read' })
    .eq('user_id', user.id)
    .in('id', ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
