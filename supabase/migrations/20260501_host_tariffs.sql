create table if not exists host_trial_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null,
  consumed boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists host_trial_usage_user_id_unique on host_trial_usage(user_id);

create table if not exists host_promotion_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  promotion_type text not null check (promotion_type in ('boost_search','home_feature','highlight')),
  created_at timestamptz not null default now()
);

create index if not exists host_promotion_usage_user_id_idx on host_promotion_usage(user_id);
