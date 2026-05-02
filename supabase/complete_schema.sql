-- ============================================================
-- Единая схема БД для VK Rental Marketplace
-- Объединяет: marketplace core + event-space rentals + admin
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUMs
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('guest', 'host', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE listing_status AS ENUM ('draft', 'pending', 'active', 'blocked');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'paid', 'refunded', 'failed');
  END IF;
END $$;

-- ============================================================
-- PROFILES / APP_USERS (единая таблица)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vk_user_id TEXT UNIQUE NOT NULL,
  vk_id BIGINT UNIQUE GENERATED ALWAYS AS (vk_user_id::bigint) STORED,
  full_name TEXT,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'guest',
  host_access_level TEXT NOT NULL DEFAULT 'basic' CHECK (host_access_level IN ('basic', 'pro', 'extended')),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- View для админки (совместимость с app_users)
CREATE OR REPLACE VIEW public.app_users AS
SELECT
  id,
  vk_id,
  full_name,
  phone,
  role,
  host_access_level,
  is_blocked,
  created_at
FROM public.profiles;

-- Функция для INSTEAD OF INSERT на app_users
CREATE OR REPLACE FUNCTION public.app_users_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (vk_user_id, full_name, phone, role, host_access_level)
  VALUES (NEW.vk_id::text, NEW.full_name, NEW.phone, NEW.role, NEW.host_access_level)
  RETURNING id, vk_id, full_name, phone, role, host_access_level, is_blocked, created_at
  INTO NEW.id, NEW.vk_id, NEW.full_name, NEW.phone, NEW.role, NEW.host_access_level, NEW.is_blocked, NEW.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS app_users_insert_trigger ON public.app_users;
CREATE TRIGGER app_users_insert_trigger
INSTEAD OF INSERT ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.app_users_insert();

-- Функция для INSTEAD OF UPDATE на app_users
CREATE OR REPLACE FUNCTION public.app_users_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles SET
    full_name = COALESCE(NEW.full_name, full_name),
    phone = COALESCE(NEW.phone, phone),
    role = COALESCE(NEW.role, role),
    host_access_level = COALESCE(NEW.host_access_level, host_access_level),
    is_blocked = COALESCE(NEW.is_blocked, is_blocked)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS app_users_update_trigger ON public.app_users;
CREATE TRIGGER app_users_update_trigger
INSTEAD OF UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.app_users_update();

-- Функция для INSTEAD OF DELETE на app_users
CREATE OR REPLACE FUNCTION public.app_users_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS app_users_delete_trigger ON public.app_users;
CREATE TRIGGER app_users_delete_trigger
INSTEAD OF DELETE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.app_users_delete();

-- ============================================================
-- LISTINGS / VENUES (единая таблица)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id),
  owner_id UUID GENERATED ALWAYS AS (host_id) STORED,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL DEFAULT 'Нижний Новгород',
  address TEXT,
  venue_type TEXT NOT NULL DEFAULT 'loft',
  capacity INTEGER NOT NULL DEFAULT 1,
  price_per_night NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  status listing_status NOT NULL DEFAULT 'pending',
  is_active BOOLEAN GENERATED ALWAYS AS (status = 'active') STORED,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- View для админки (совместимость с venues)
CREATE OR REPLACE VIEW public.venues AS
SELECT
  id,
  owner_id,
  title,
  description,
  city,
  address,
  venue_type,
  capacity,
  is_active,
  created_at,
  updated_at
FROM public.listings;

-- Функция для INSTEAD OF INSERT на venues
CREATE OR REPLACE FUNCTION public.venues_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.listings (host_id, title, description, city, address, venue_type, capacity, status)
  VALUES (NEW.owner_id, NEW.title, NEW.description, NEW.city, NEW.address, NEW.venue_type, NEW.capacity, CASE WHEN NEW.is_active THEN 'active' ELSE 'pending' END)
  RETURNING id, host_id AS owner_id, title, description, city, address, venue_type, capacity, is_active, created_at, updated_at
  INTO NEW.id, NEW.owner_id, NEW.title, NEW.description, NEW.city, NEW.address, NEW.venue_type, NEW.capacity, NEW.is_active, NEW.created_at, NEW.updated_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS venues_insert_trigger ON public.venues;
CREATE TRIGGER venues_insert_trigger
INSTEAD OF INSERT ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.venues_insert();

-- Функция для INSTEAD OF UPDATE на venues
CREATE OR REPLACE FUNCTION public.venues_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.listings SET
    title = COALESCE(NEW.title, title),
    description = COALESCE(NEW.description, description),
    city = COALESCE(NEW.city, city),
    address = COALESCE(NEW.address, address),
    venue_type = COALESCE(NEW.venue_type, venue_type),
    capacity = COALESCE(NEW.capacity, capacity),
    status = CASE WHEN NEW.is_active IS NOT NULL THEN CASE WHEN NEW.is_active THEN 'active' ELSE 'pending' END ELSE status END,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS venues_update_trigger ON public.venues;
CREATE TRIGGER venues_update_trigger
INSTEAD OF UPDATE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.venues_update();

-- Функция для INSTEAD OF DELETE на venues
CREATE OR REPLACE FUNCTION public.venues_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.listings WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS venues_delete_trigger ON public.venues;
CREATE TRIGGER venues_delete_trigger
INSTEAD OF DELETE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.venues_delete();

-- ============================================================
-- PRICING RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  rental_mode TEXT NOT NULL CHECK (rental_mode IN ('hourly', 'daily', 'mixed')),
  currency TEXT NOT NULL DEFAULT 'RUB',
  base_hourly_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_daily_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  minimum_hours INTEGER NOT NULL DEFAULT 1,
  weekend_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1,
  night_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1,
  cleaning_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(venue_id)
);

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  included BOOLEAN NOT NULL DEFAULT FALSE,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VENUE PHOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.venue_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FREE BOOKING POLICY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.free_booking_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  requires_host_approval BOOLEAN NOT NULL DEFAULT TRUE,
  max_active_free_bookings_per_user INTEGER NOT NULL DEFAULT 1,
  no_show_penalty_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(venue_id)
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  listing_id UUID GENERATED ALWAYS AS (venue_id) STORED,
  guest_id UUID NOT NULL REFERENCES public.profiles(id),
  status booking_status NOT NULL DEFAULT 'pending',
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  date_from DATE GENERATED ALWAYS AS (start_at::date) STORED,
  date_to DATE GENERATED ALWAYS AS (end_at::date) STORED,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (total_amount) STORED,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_bookings_venue_time ON public.bookings(venue_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status_expires_at ON public.bookings(status, expires_at);

-- Prevent overlapping confirmed/pending bookings for same venue
CREATE OR REPLACE FUNCTION public.prevent_booking_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.venue_id = NEW.venue_id
      AND b.id <> NEW.id
      AND b.status IN ('pending', 'confirmed')
      AND tstzrange(b.start_at, b.end_at, '[)') && tstzrange(NEW.start_at, NEW.end_at, '[)')
  ) THEN
    RAISE EXCEPTION 'Booking slot overlaps with existing booking';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_booking_overlap ON public.bookings;
CREATE TRIGGER trg_prevent_booking_overlap
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_booking_overlap();

-- ============================================================
-- BOOKING INVENTORY USAGE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.booking_inventory_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  provider TEXT NOT NULL DEFAULT 'vkpay',
  provider_payment_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'created',
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYOUTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CHARGEBACKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chargebacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORTS & DISPUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id),
  status TEXT NOT NULL DEFAULT 'open',
  assigned_admin_id UUID,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'sent',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FAVORITES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

-- ============================================================
-- AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  price_override NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, date)
);

-- ============================================================
-- LISTING METRICS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listing_metrics (
  listing_id UUID PRIMARY KEY REFERENCES public.listings(id),
  views INT NOT NULL DEFAULT 0,
  favorites INT NOT NULL DEFAULT 0,
  booking_intents INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVENT OUTBOX
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================
-- WEBHOOK EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  payload_hash TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HOST TRIAL & PROMOTION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.host_trial_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ NOT NULL,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS host_trial_usage_user_id_unique ON public.host_trial_usage(user_id);

CREATE TABLE IF NOT EXISTS public.host_promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('boost_search','home_feature','highlight')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS host_promotion_usage_user_id_idx ON public.host_promotion_usage(user_id);

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  p_venue_id UUID,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.venue_id = p_venue_id
      AND b.status IN ('pending', 'confirmed')
      AND tstzrange(b.start_at, b.end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_summary_analytics()
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  WITH
  users_agg AS (
    SELECT
      COUNT(*) FILTER (WHERE role = 'host') AS hosts,
      COUNT(*) FILTER (WHERE role = 'guest') AS guests,
      COUNT(*) FILTER (WHERE role = 'admin') AS admins,
      COUNT(*) AS total_users
    FROM public.profiles
  ),
  bookings_agg AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_bookings,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'confirmed'), 0)::NUMERIC(12,2) AS confirmed_revenue,
      COALESCE(SUM(EXTRACT(EPOCH FROM (end_at - start_at)) / 3600) FILTER (WHERE status = 'confirmed'), 0)::NUMERIC(12,2) AS confirmed_hours
    FROM public.bookings
  )
  SELECT jsonb_build_object(
    'users', row_to_json(users_agg),
    'bookings', row_to_json(bookings_agg)
  )
  FROM users_agg, bookings_agg;
$$;

CREATE OR REPLACE FUNCTION public.admin_venue_analytics(p_venue_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  SELECT jsonb_build_object(
    'venue_id', p_venue_id,
    'bookings_count', COUNT(*),
    'revenue', COALESCE(SUM(total_amount), 0)::NUMERIC(12,2),
    'hours', COALESCE(SUM(EXTRACT(EPOCH FROM (end_at - start_at)) / 3600), 0)::NUMERIC(12,2)
  )
  FROM public.bookings
  WHERE venue_id = p_venue_id AND status = 'confirmed';
$$;

CREATE OR REPLACE FUNCTION public.admin_user_analytics(p_user_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'owned_venues_count', (SELECT COUNT(*) FROM public.listings l WHERE l.host_id = p_user_id),
    'bookings_as_guest_count', (SELECT COUNT(*) FROM public.bookings b WHERE b.guest_id = p_user_id),
    'guest_spend', (SELECT COALESCE(SUM(total_amount), 0)::NUMERIC(12,2) FROM public.bookings b WHERE b.guest_id = p_user_id AND b.status = 'confirmed')
  );
$$;

-- ============================================================
-- VIEWS FOR ANALYTICS
-- ============================================================
CREATE OR REPLACE VIEW public.inventory_usage_stats AS
SELECT
  ii.name AS inventory_name,
  COUNT(biu.id) AS usage_count,
  COALESCE(SUM(biu.total_price), 0)::NUMERIC(12,2) AS total_revenue
FROM public.inventory_items ii
LEFT JOIN public.booking_inventory_usage biu ON biu.inventory_item_id = ii.id
GROUP BY ii.name;

CREATE OR REPLACE VIEW public.hourly_activity_stats AS
SELECT
  EXTRACT(hour FROM b.start_at)::INT AS hour_of_day,
  COUNT(*) AS bookings_count,
  COALESCE(SUM(b.total_amount), 0)::NUMERIC(12,2) AS total_revenue
FROM public.bookings b
WHERE b.status IN ('pending', 'confirmed')
GROUP BY EXTRACT(hour FROM b.start_at)
ORDER BY hour_of_day;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargebacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to read app role from JWT
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS app_role
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE((auth.jwt() ->> 'app_role')::app_role, 'guest'::app_role)
$$;

-- Profiles
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
FOR SELECT
USING (id = auth.uid() OR public.current_app_role() = 'admin');

-- Listings
DROP POLICY IF EXISTS "public_read_active_listings" ON public.listings;
CREATE POLICY "public_read_active_listings" ON public.listings
FOR SELECT
USING (status = 'active' OR public.current_app_role() IN ('host', 'admin'));

DROP POLICY IF EXISTS "host_manage_own_listings" ON public.listings;
CREATE POLICY "host_manage_own_listings" ON public.listings
FOR ALL
USING (host_id = auth.uid() OR public.current_app_role() = 'admin')
WITH CHECK (host_id = auth.uid() OR public.current_app_role() = 'admin');

-- Bookings
DROP POLICY IF EXISTS "guest_read_own_bookings" ON public.bookings;
CREATE POLICY "guest_read_own_bookings" ON public.bookings
FOR SELECT
USING (
  guest_id = auth.uid()
  OR public.current_app_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = bookings.venue_id AND l.host_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "guest_create_booking" ON public.bookings;
CREATE POLICY "guest_create_booking" ON public.bookings
FOR INSERT
WITH CHECK (guest_id = auth.uid() AND public.current_app_role() IN ('guest', 'host', 'admin'));

DROP POLICY IF EXISTS "host_update_booking_status" ON public.bookings;
CREATE POLICY "host_update_booking_status" ON public.bookings
FOR UPDATE
USING (
  public.current_app_role() = 'admin' OR EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = bookings.venue_id AND l.host_id = auth.uid()
  )
);

-- Payments
DROP POLICY IF EXISTS "payment_visible_to_related_users" ON public.payments;
CREATE POLICY "payment_visible_to_related_users" ON public.payments
FOR SELECT
USING (
  public.current_app_role() = 'admin' OR EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.listings l ON l.id = b.venue_id
    WHERE b.id = payments.booking_id AND (b.guest_id = auth.uid() OR l.host_id = auth.uid())
  )
);

-- Notifications
DROP POLICY IF EXISTS "notifications_owner" ON public.notifications;
CREATE POLICY "notifications_owner" ON public.notifications
FOR SELECT
USING (user_id = auth.uid() OR public.current_app_role() = 'admin');

DROP POLICY IF EXISTS "notifications_owner_update" ON public.notifications;
CREATE POLICY "notifications_owner_update" ON public.notifications
FOR UPDATE
USING (user_id = auth.uid() OR public.current_app_role() = 'admin')
WITH CHECK (user_id = auth.uid() OR public.current_app_role() = 'admin');

-- Messages
DROP POLICY IF EXISTS "chat_participants_read" ON public.messages;
CREATE POLICY "chat_participants_read" ON public.messages
FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.current_app_role() = 'admin');

DROP POLICY IF EXISTS "chat_participants_write" ON public.messages;
CREATE POLICY "chat_participants_write" ON public.messages
FOR INSERT
WITH CHECK (sender_id = auth.uid() AND receiver_id IS NOT NULL);

-- Reviews
DROP POLICY IF EXISTS "public_read_published_reviews" ON public.reviews;
CREATE POLICY "public_read_published_reviews" ON public.reviews
FOR SELECT
USING (status = 'published' OR public.current_app_role() = 'admin');

DROP POLICY IF EXISTS "guest_create_reviews" ON public.reviews;
CREATE POLICY "guest_create_reviews" ON public.reviews
FOR INSERT
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_reviews" ON public.reviews;
CREATE POLICY "admin_manage_reviews" ON public.reviews
FOR UPDATE
USING (public.current_app_role() = 'admin');

-- Disputes
DROP POLICY IF EXISTS "admin_manage_disputes" ON public.disputes;
CREATE POLICY "admin_manage_disputes" ON public.disputes
FOR ALL
USING (public.current_app_role() = 'admin')
WITH CHECK (public.current_app_role() = 'admin');

-- Payouts
DROP POLICY IF EXISTS "host_view_own_payouts" ON public.payouts;
CREATE POLICY "host_view_own_payouts" ON public.payouts
FOR SELECT
USING (host_id = auth.uid() OR public.current_app_role() = 'admin');

DROP POLICY IF EXISTS "host_create_payouts" ON public.payouts;
CREATE POLICY "host_create_payouts" ON public.payouts
FOR INSERT
WITH CHECK (host_id = auth.uid() OR public.current_app_role() = 'admin');

DROP POLICY IF EXISTS "admin_manage_payouts" ON public.payouts;
CREATE POLICY "admin_manage_payouts" ON public.payouts
FOR UPDATE
USING (public.current_app_role() = 'admin');

-- Chargebacks
DROP POLICY IF EXISTS "admin_manage_chargebacks" ON public.chargebacks;
CREATE POLICY "admin_manage_chargebacks" ON public.chargebacks
FOR ALL
USING (public.current_app_role() = 'admin')
WITH CHECK (public.current_app_role() = 'admin');

-- Favorites
DROP POLICY IF EXISTS "favorites_owner_select" ON public.favorites;
CREATE POLICY "favorites_owner_select" ON public.favorites
FOR SELECT
USING (user_id = auth.uid() OR public.current_app_role() = 'admin');

DROP POLICY IF EXISTS "favorites_owner_write" ON public.favorites;
CREATE POLICY "favorites_owner_write" ON public.favorites
FOR ALL
USING (user_id = auth.uid() OR public.current_app_role() = 'admin')
WITH CHECK (user_id = auth.uid() OR public.current_app_role() = 'admin');

-- Availability
DROP POLICY IF EXISTS "availability_public_read" ON public.availability;
CREATE POLICY "availability_public_read" ON public.availability
FOR SELECT
USING (public.current_app_role() IN ('guest','host','admin'));

DROP POLICY IF EXISTS "availability_host_manage" ON public.availability;
CREATE POLICY "availability_host_manage" ON public.availability
FOR ALL
USING (
  public.current_app_role() = 'admin' OR EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = availability.listing_id AND l.host_id = auth.uid()
  )
)
WITH CHECK (
  public.current_app_role() = 'admin' OR EXISTS (
    SELECT 1 FROM public.listings l WHERE l.id = availability.listing_id AND l.host_id = auth.uid()
  )
);

-- Listing Metrics
DROP POLICY IF EXISTS "listing_metrics_public_read" ON public.listing_metrics;
CREATE POLICY "listing_metrics_public_read" ON public.listing_metrics
FOR SELECT
USING (public.current_app_role() IN ('guest','host','admin'));

DROP POLICY IF EXISTS "listing_metrics_admin_write" ON public.listing_metrics;
CREATE POLICY "listing_metrics_admin_write" ON public.listing_metrics
FOR ALL
USING (public.current_app_role() = 'admin')
WITH CHECK (public.current_app_role() = 'admin');

-- Event Outbox
DROP POLICY IF EXISTS "event_outbox_admin_only" ON public.event_outbox;
CREATE POLICY "event_outbox_admin_only" ON public.event_outbox
FOR ALL
USING (public.current_app_role() = 'admin')
WITH CHECK (public.current_app_role() = 'admin');

-- Webhook Events
DROP POLICY IF EXISTS "webhook_events_admin_only" ON public.webhook_events;
CREATE POLICY "webhook_events_admin_only" ON public.webhook_events
FOR ALL
USING (public.current_app_role() = 'admin')
WITH CHECK (public.current_app_role() = 'admin');

-- Audit Logs
DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_logs;
CREATE POLICY "audit_admin_read" ON public.audit_logs
FOR SELECT
USING (public.current_app_role() = 'admin');

DROP POLICY IF EXISTS "audit_any_insert" ON public.audit_logs;
CREATE POLICY "audit_any_insert" ON public.audit_logs
FOR INSERT
WITH CHECK (public.current_app_role() IN ('guest','host','admin'));
