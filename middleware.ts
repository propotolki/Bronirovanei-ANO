import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasRequiredRole, type AppRole } from '@/lib/rbac/roles';
import { getSessionUser } from '@/lib/server/auth';

const rules: Array<{ prefix: string; role: AppRole }> = [
  { prefix: '/api/guest', role: 'guest' },
  { prefix: '/api/host', role: 'host' },
  { prefix: '/api/admin', role: 'admin' },
  { prefix: '/owner', role: 'host' },
  { prefix: '/admin', role: 'admin' },
];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const rule = rules.find((r) => pathname.startsWith(r.prefix));

  if (!rule) return NextResponse.next();

  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasRequiredRole(user.role, rule.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/owner/:path*', '/admin/:path*'],
};
