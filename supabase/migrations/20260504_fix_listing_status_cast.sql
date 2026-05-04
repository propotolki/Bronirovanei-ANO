-- Fix listing_status enum casting in trigger functions

-- Drop existing triggers first
DROP TRIGGER IF EXISTS venues_insert_trigger ON public.venues;
DROP TRIGGER IF EXISTS venues_update_trigger ON public.venues;

-- Fix the venues_insert function to properly cast to listing_status enum
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
    CASE WHEN NEW.is_active THEN 'active'::listing_status ELSE 'pending'::listing_status END
  )
  RETURNING id, host_id AS owner_id, title, description, city, address, venue_type, capacity, is_active, created_at, updated_at
  INTO NEW.id, NEW.owner_id, NEW.title, NEW.description, NEW.city, NEW.address, NEW.venue_type, NEW.capacity, NEW.is_active, NEW.created_at, NEW.updated_at;
  RETURN NEW;
END;
$$;

-- Fix the venues_update function to properly cast to listing_status enum
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