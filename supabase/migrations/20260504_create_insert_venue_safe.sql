-- Create RPC function to safely insert venues with proper enum casting

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.insert_venue_safe(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_venue_safe(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO service_role;