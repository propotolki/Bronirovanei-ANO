create or replace function public.check_booking_conflict(
  p_venue_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.bookings b
    where b.venue_id = p_venue_id
      and b.status in ('pending', 'confirmed')
      and tstzrange(b.start_at, b.end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
  );
$$;
