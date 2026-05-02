-- Core tables for event-space rentals in Nizhny Novgorod

create extension if not exists pgcrypto;

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  description text,
  city text not null default 'Нижний Новгород',
  address text,
  venue_type text not null,
  capacity integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  rental_mode text not null check (rental_mode in ('hourly', 'daily', 'mixed')),
  currency text not null default 'RUB',
  base_hourly_rate numeric(12,2) not null default 0,
  base_daily_rate numeric(12,2) not null default 0,
  minimum_hours integer not null default 1,
  weekend_multiplier numeric(5,2) not null default 1,
  night_multiplier numeric(5,2) not null default 1,
  cleaning_fee numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(venue_id)
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  included boolean not null default false,
  unit_price numeric(12,2) not null default 0,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.free_booking_policy (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  requires_host_approval boolean not null default true,
  max_active_free_bookings_per_user integer not null default 1,
  no_show_penalty_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique(venue_id)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  guest_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  is_free boolean not null default false,
  start_at timestamptz not null,
  end_at timestamptz not null,
  total_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index if not exists idx_bookings_venue_time on public.bookings(venue_id, start_at, end_at);

-- Prevent overlapping confirmed/pending bookings for same venue
create or replace function public.prevent_booking_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.bookings b
    where b.venue_id = new.venue_id
      and b.id <> new.id
      and b.status in ('pending', 'confirmed')
      and tstzrange(b.start_at, b.end_at, '[)') && tstzrange(new.start_at, new.end_at, '[)')
  ) then
    raise exception 'Booking slot overlaps with existing booking';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_booking_overlap on public.bookings;
create trigger trg_prevent_booking_overlap
before insert or update on public.bookings
for each row
execute function public.prevent_booking_overlap();
