-- Fix all trigger functions for venues/venues view

-- First, drop existing triggers and functions
DROP TRIGGER IF EXISTS venues_insert_trigger ON public.venues;
DROP TRIGGER IF EXISTS venues_update_trigger ON public.venues;
DROP FUNCTION IF EXISTS public.venues_insert();
DROP FUNCTION IF EXISTS public.venues_update();

-- Create improved insert function with proper enum casting
CREATE OR REPLACE FUNCTION public.venues_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.listings (host_id, title, description, city, address, venue_type, capacity, status)
  VALUES (
    NEW.owner_id, 
    NEW.title, 
    NEW.description, 
    NEW.city, 
    NEW.address, 
    NEW.venue_type, 
    NEW.capacity, 
    CASE 
      WHEN NEW.is_active THEN 'active'::listing_status
      ELSE 'pending'::listing_status
    END
  )
  RETURNING id, host_id AS owner_id, title, description, city, address, venue_type, capacity, is_active, created_at, updated_at
  INTO NEW.id, NEW.owner_id, NEW.title, NEW.description, NEW.city, NEW.address, NEW.venue_type, NEW.capacity, NEW.is_active, NEW.created_at, NEW.updated_at;
  RETURN NEW;
END;
$$;

-- Create improved update function with proper enum casting
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
    status = CASE 
      WHEN NEW.is_active IS NOT NULL THEN 
        CASE WHEN NEW.is_active THEN 'active'::listing_status ELSE 'pending'::listing_status END 
      ELSE status 
    END,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER venues_insert_trigger
INSTEAD OF INSERT ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.venues_insert();

CREATE TRIGGER venues_update_trigger
INSTEAD OF UPDATE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.venues_update();

-- Also create the insert_venue_safe RPC function for direct listings table access
CREATE OR REPLACE FUNCTION public.insert_venue_safe(
  p_host_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_city TEXT DEFAULT 'Нижний Новгород',
  p_address TEXT DEFAULT NULL,
  p_venue_type TEXT DEFAULT 'loft',
  p_capacity INTEGER DEFAULT 1
)
RETURNS TABLE(id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.listings (host_id, title, description, city, address, venue_type, capacity, status)
  VALUES (
    p_host_id, 
    p_title, 
    p_description, 
    p_city, 
    p_address, 
    p_venue_type, 
    p_capacity, 
    'pending'::listing_status
  )
  RETURNING id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.insert_venue_safe(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_venue_safe(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO service_role;