-- Fix: app_users_insert trigger must handle NULL host_access_level
-- The profiles table has DEFAULT 'basic' but it doesn't apply when NULL is explicitly passed

CREATE OR REPLACE FUNCTION public.app_users_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (vk_user_id, full_name, phone, role, host_access_level)
  VALUES (
    NEW.vk_id::text,
    NEW.full_name,
    NEW.phone,
    NEW.role,
    COALESCE(NEW.host_access_level, 'basic')
  )
  RETURNING id, vk_user_id, full_name, phone, role, host_access_level, is_blocked, created_at
  INTO NEW.id, NEW.vk_id, NEW.full_name, NEW.phone, NEW.role, NEW.host_access_level, NEW.is_blocked, NEW.created_at;
  RETURN NEW;
END;
$$;

-- Also update the view to include host_access_level in the insertable columns
CREATE OR REPLACE VIEW public.app_users AS
SELECT
  id,
  vk_user_id AS vk_id,
  full_name,
  phone,
  role,
  host_access_level,
  is_blocked,
  created_at
FROM public.profiles;

COMMENT ON FUNCTION public.app_users_insert() IS 'Handles INSERT into app_users view with COALESCE for host_access_level';
