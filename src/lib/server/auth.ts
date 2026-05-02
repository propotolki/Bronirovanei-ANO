import { createHmac } from 'crypto';
import { safeEqualHex } from '@/lib/server/security';
import { NextRequest } from 'next/server';
import type { AppRole } from '@/lib/rbac/roles';
import { supabaseAdmin } from '@/lib/server/supabase';

export type SessionUser = {
  id: string;
  vkUserId: string;
  role: AppRole;
};

function verifyVkSignature(rawInitData: string, signature: string) {
  const secret = process.env.VK_SECRET_KEY;
  if (!secret) return false;

  const expected = createHmac('sha256', secret).update(rawInitData).digest('hex');
  return safeEqualHex(expected, signature);
}

export async function resolveVkUser(req: NextRequest): Promise<SessionUser | null> {
  const rawInitData = req.headers.get('x-vk-init-data');
  const signature = req.headers.get('x-vk-sign');

  if (!rawInitData || !signature || !verifyVkSignature(rawInitData, signature)) return null;

  const initPayload = JSON.parse(rawInitData) as { vk_user_id?: string; role?: AppRole };
  if (!initPayload.vk_user_id) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        vk_user_id: initPayload.vk_user_id,
        role: initPayload.role ?? 'guest',
      },
      { onConflict: 'vk_user_id' }
    )
    .select('id,vk_user_id,role')
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    vkUserId: profile.vk_user_id,
    role: profile.role,
  } as SessionUser;
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  return resolveVkUser(req);
}
