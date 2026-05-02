create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  vk_id bigint not null unique,
  full_name text not null,
  phone text,
  role text not null check (role in ('host', 'guest', 'admin')),
  host_access_level text not null default 'basic' check (host_access_level in ('basic', 'pro', 'extended')),
  is_blocked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.venues add column if not exists discount_percent numeric(5,2) not null default 0;

create table if not exists public.venue_photos (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  photo_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_inventory_usage (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity integer not null default 1,
  total_price numeric(12,2) not null default 0
);

create or replace view public.inventory_usage_stats as
select
  ii.name as inventory_name,
  count(biu.id) as usage_count,
  coalesce(sum(biu.total_price), 0)::numeric(12,2) as total_revenue
from public.inventory_items ii
left join public.booking_inventory_usage biu on biu.inventory_item_id = ii.id
group by ii.name;

create or replace view public.hourly_activity_stats as
select
  extract(hour from b.start_at)::int as hour_of_day,
  count(*) as bookings_count,
  coalesce(sum(b.total_amount), 0)::numeric(12,2) as total_revenue
from public.bookings b
where b.status in ('pending', 'confirmed')
group by extract(hour from b.start_at)
order by hour_of_day;

create or replace function public.admin_summary_analytics()
returns jsonb
language sql
stable
as $$
  with
  users_agg as (
    select
      count(*) filter (where role = 'host') as hosts,
      count(*) filter (where role = 'guest') as guests,
      count(*) filter (where role = 'admin') as admins,
      count(*) as total_users
    from public.app_users
  ),
  bookings_agg as (
    select
      count(*) filter (where status = 'confirmed') as confirmed_bookings,
      coalesce(sum(total_amount) filter (where status = 'confirmed'), 0)::numeric(12,2) as confirmed_revenue,
      coalesce(sum(extract(epoch from (end_at - start_at)) / 3600) filter (where status = 'confirmed'), 0)::numeric(12,2) as confirmed_hours
    from public.bookings
  )
  select jsonb_build_object(
    'users', row_to_json(users_agg),
    'bookings', row_to_json(bookings_agg)
  )
  from users_agg, bookings_agg;
$$;

create or replace function public.admin_venue_analytics(p_venue_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'venue_id', p_venue_id,
    'bookings_count', count(*),
    'revenue', coalesce(sum(total_amount), 0)::numeric(12,2),
    'hours', coalesce(sum(extract(epoch from (end_at - start_at)) / 3600), 0)::numeric(12,2)
  )
  from public.bookings
  where venue_id = p_venue_id and status = 'confirmed';
$$;

create or replace function public.admin_user_analytics(p_user_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'user_id', p_user_id,
    'owned_venues_count', (select count(*) from public.venues v where v.owner_id = p_user_id),
    'bookings_as_guest_count', (select count(*) from public.bookings b where b.guest_id = p_user_id),
    'guest_spend', (select coalesce(sum(total_amount), 0)::numeric(12,2) from public.bookings b where b.guest_id = p_user_id and b.status = 'confirmed')
  );
$$;
