import { NextRequest, NextResponse } from 'next/server';
import { resolveVkUser } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  const user = await resolveVkUser(req);
  if (!user) return NextResponse.json({ error: 'Invalid VK signature or payload' }, { status: 401 });

  return NextResponse.json({
    ok: true,
    user,
  });
}
