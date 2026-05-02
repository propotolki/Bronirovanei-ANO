import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

const buckets = new Map<string, { count: number; resetAt: number }>();

export function safeEqualHex(a: string, b: string) {
  const ah = Buffer.from(a, 'hex');
  const bh = Buffer.from(b, 'hex');
  if (ah.length !== bh.length) return false;
  return timingSafeEqual(ah, bh);
}

export function hashPayload(payload: string) {
  return createHash('sha256').update(payload).digest('hex');
}

export function sanitizeText(input: string, max = 2000) {
  return input.replace(/[<>]/g, '').trim().slice(0, max);
}

export function checkRateLimit(req: NextRequest, limit = 60, windowMs = 60_000) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (current.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }

  current.count += 1;
  return { ok: true };
}
