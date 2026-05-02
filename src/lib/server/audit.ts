import { supabaseAdmin } from '@/lib/server/supabase';

export async function logAudit(actorId: string, action: string, entityType: string, entityId: string, payload: Record<string, unknown>) {
  await supabaseAdmin.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    payload,
  });
}
