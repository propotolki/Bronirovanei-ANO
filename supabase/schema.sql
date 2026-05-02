-- Core marketplace schema for VK Mini App rental platform.
create type app_role as enum ('guest', 'host', 'admin');
create type listing_status as enum ('draft', 'pending', 'active', 'blocked');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type payment_status as enum ('created', 'authorized', 'paid', 'refunded', 'failed');

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  vk_user_id text unique not null,
  full_name text,
  role app_role not null default 'guest',
  created_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles(id),
  title text not null,
  description text,
  city text not null,
  price_per_night numeric(12,2) not null,
  status listing_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  guest_id uuid not null references profiles(id),
  date_from date not null,
  date_to date not null,
  total_price numeric(12,2) not null,
  status booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  provider text not null default 'vkpay',
  provider_payment_id text,
  amount numeric(12,2) not null,
  status payment_status not null default 'created',
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id),
  target_type text not null,
  target_id text not null,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table listings enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table reports enable row level security;

-- Helper to read app role from JWT (set by Supabase auth hook in production)
create or replace function current_app_role()
returns app_role
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'app_role')::app_role, 'guest'::app_role)
$$;

-- Profiles
create policy "profiles_self_read" on profiles
for select
using (id = auth.uid() or current_app_role() = 'admin');

-- Listings
create policy "public_read_active_listings" on listings
for select
using (status = 'active' or current_app_role() in ('host', 'admin'));

create policy "host_manage_own_listings" on listings
for all
using (host_id = auth.uid() or current_app_role() = 'admin')
with check (host_id = auth.uid() or current_app_role() = 'admin');

-- Bookings
create policy "guest_read_own_bookings" on bookings
for select
using (
  guest_id = auth.uid()
  or current_app_role() = 'admin'
  or exists (
    select 1 from listings l where l.id = bookings.listing_id and l.host_id = auth.uid()
  )
);

create policy "guest_create_booking" on bookings
for insert
with check (guest_id = auth.uid() and current_app_role() in ('guest', 'host', 'admin'));

create policy "host_update_booking_status" on bookings
for update
using (
  current_app_role() = 'admin' or exists (
    select 1 from listings l where l.id = bookings.listing_id and l.host_id = auth.uid()
  )
);

-- Payments
create policy "payment_visible_to_related_users" on payments
for select
using (
  current_app_role() = 'admin' or exists (
    select 1
    from bookings b
    join listings l on l.id = b.listing_id
    where b.id = payments.booking_id and (b.guest_id = auth.uid() or l.host_id = auth.uid())
  )
);

-- Reports & Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  title text not null,
  body text not null,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);
alter table notifications enable row level security;

create policy "notifications_owner" on notifications
for select
using (user_id = auth.uid() or current_app_role() = 'admin');

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  sender_id uuid not null references profiles(id),
  receiver_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
alter table messages enable row level security;

create policy "chat_participants_read" on messages
for select
using (sender_id = auth.uid() or receiver_id = auth.uid() or current_app_role() = 'admin');

create policy "chat_participants_write" on messages
for insert
with check (sender_id = auth.uid() and (receiver_id is not null));

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  listing_id uuid not null references listings(id),
  author_id uuid not null references profiles(id),
  rating int not null check (rating between 1 and 5),
  text text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table reviews enable row level security;

create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id),
  status text not null default 'open',
  assigned_admin_id uuid,
  resolution text,
  created_at timestamptz not null default now()
);
alter table disputes enable row level security;

create policy "public_read_published_reviews" on reviews
for select
using (status = 'published' or current_app_role() = 'admin');

create policy "guest_create_reviews" on reviews
for insert
with check (author_id = auth.uid());

create policy "admin_manage_reviews" on reviews
for update
using (current_app_role() = 'admin');

create policy "admin_manage_disputes" on disputes
for all
using (current_app_role() = 'admin')
with check (current_app_role() = 'admin');

alter table listings add column if not exists lat double precision;
alter table listings add column if not exists lng double precision;

alter table messages add column if not exists delivery_status text not null default 'sent';
alter table messages add column if not exists read_at timestamptz;

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles(id),
  amount numeric(12,2) not null,
  currency text not null default 'RUB',
  status text not null default 'requested',
  created_at timestamptz not null default now()
);
alter table payouts enable row level security;

create table if not exists chargebacks (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
alter table chargebacks enable row level security;

create policy "host_view_own_payouts" on payouts
for select
using (host_id = auth.uid() or current_app_role() = 'admin');

create policy "host_create_payouts" on payouts
for insert
with check (host_id = auth.uid() or current_app_role() = 'admin');

create policy "admin_manage_payouts" on payouts
for update
using (current_app_role() = 'admin');

create policy "admin_manage_chargebacks" on chargebacks
for all
using (current_app_role() = 'admin')
with check (current_app_role() = 'admin');

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  listing_id uuid not null references listings(id),
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
alter table favorites enable row level security;

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  date date not null,
  is_available boolean not null default true,
  price_override numeric(12,2),
  created_at timestamptz not null default now(),
  unique (listing_id, date)
);
alter table availability enable row level security;

create policy "favorites_owner_select" on favorites
for select
using (user_id = auth.uid() or current_app_role() = 'admin');

create policy "favorites_owner_write" on favorites
for all
using (user_id = auth.uid() or current_app_role() = 'admin')
with check (user_id = auth.uid() or current_app_role() = 'admin');

create policy "availability_public_read" on availability
for select
using (current_app_role() in ('guest','host','admin'));

create policy "availability_host_manage" on availability
for all
using (
  current_app_role() = 'admin' or exists (
    select 1 from listings l where l.id = availability.listing_id and l.host_id = auth.uid()
  )
)
with check (
  current_app_role() = 'admin' or exists (
    select 1 from listings l where l.id = availability.listing_id and l.host_id = auth.uid()
  )
);

alter table notifications add column if not exists read_at timestamptz;

create policy "notifications_owner_update" on notifications
for update
using (user_id = auth.uid() or current_app_role() = 'admin')
with check (user_id = auth.uid() or current_app_role() = 'admin');

create table if not exists listing_metrics (
  listing_id uuid primary key references listings(id),
  views int not null default 0,
  favorites int not null default 0,
  booking_intents int not null default 0,
  updated_at timestamptz not null default now()
);
alter table listing_metrics enable row level security;

create policy "listing_metrics_public_read" on listing_metrics
for select
using (current_app_role() in ('guest','host','admin'));

create policy "listing_metrics_admin_write" on listing_metrics
for all
using (current_app_role() = 'admin')
with check (current_app_role() = 'admin');

create table if not exists event_outbox (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  payload jsonb not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table event_outbox enable row level security;

create policy "event_outbox_admin_only" on event_outbox
for all
using (current_app_role() = 'admin')
with check (current_app_role() = 'admin');

alter table bookings add column if not exists expires_at timestamptz;
create index if not exists idx_bookings_status_expires_at on bookings(status, expires_at);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  payload_hash text not null unique,
  payload jsonb not null,
  received_at timestamptz not null default now()
);
alter table webhook_events enable row level security;

create policy "webhook_events_admin_only" on webhook_events
for all
using (current_app_role() = 'admin')
with check (current_app_role() = 'admin');

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
alter table audit_logs enable row level security;

create policy "audit_admin_read" on audit_logs
for select
using (current_app_role() = 'admin');

create policy "audit_any_insert" on audit_logs
for insert
with check (current_app_role() in ('guest','host','admin'));
