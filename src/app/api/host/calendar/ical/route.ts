import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

function toICalDate(date: string) {
  return date.replaceAll('-', '');
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const listingId = req.nextUrl.searchParams.get('listingId');
  if (!listingId) return new Response('listingId is required', { status: 400 });

  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('id,title,host_id')
    .eq('id', listingId)
    .eq('host_id', user.id)
    .single();

  if (!listing) return new Response('Listing not found', { status: 404 });

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('id,date_from,date_to,status')
    .eq('listing_id', listingId)
    .in('status', ['pending', 'confirmed']);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VK Rental//Calendar//RU',
  ];

  for (const b of bookings ?? []) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${b.id}@vk-rental`);
    lines.push(`SUMMARY:${listing.title}`);
    lines.push(`DTSTART;VALUE=DATE:${toICalDate(b.date_from)}`);
    lines.push(`DTEND;VALUE=DATE:${toICalDate(b.date_to)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
    },
  });
}
