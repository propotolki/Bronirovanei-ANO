import { supabaseAdmin } from '@/lib/server/supabase';

export async function createNotification(userId: string, title: string, body: string) {
  const { data: notification } = await supabaseAdmin
    .from('notifications')
    .insert({ user_id: userId, title, body, status: 'queued' })
    .select('*')
    .single();

  if (notification) {
    await supabaseAdmin.from('event_outbox').insert({
      topic: 'notification.created',
      payload: notification,
      status: 'pending',
    });
  }
}
