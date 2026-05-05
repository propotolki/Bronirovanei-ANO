import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  // Parse filter parameters
  const district = searchParams.get("district"); // city or area
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minCapacity = searchParams.get("minCapacity");
  const venueType = searchParams.get("venueType");
  const hasInventory = searchParams.get("hasInventory"); // filter by inventory items

  // Start building query
  let query = supabase
    .from("venues")
    .select(`
      id, title, description, city, address, venue_type, capacity, is_active,
      pricing_rules(base_hourly_rate, base_daily_rate, rental_mode),
      venue_photos(photo_url, sort_order)
    `)
    .eq("is_active", true);

  // Filter by district/city
  if (district) {
    query = query.ilike("city", `%${district}%`);
  }

  // Filter by venue type
  if (venueType && venueType !== "all") {
    query = query.eq("venue_type", venueType);
  }

  // Filter by capacity
  if (minCapacity) {
    query = query.gte("capacity", Number(minCapacity));
  }

  // Filter by price (need to join pricing_rules)
  // Note: price filtering is complex because we have hourly/daily rates
  // For simplicity, we'll filter by base_daily_rate if provided
  if (minPrice || maxPrice) {
    // We'll need to filter after fetching or use a more complex query
    // For now, we'll fetch all and filter in memory (not ideal for large datasets)
  }

  // Filter by inventory (hasInventory)
  if (hasInventory === "true") {
    // This requires a subquery or join - for simplicity we'll handle after fetch
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let venues = data ?? [];

  // Filter by price in memory (since pricing_rules is nested)
  if (minPrice || maxPrice) {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;
    venues = venues.filter((venue: any) => {
      const pricing = venue.pricing_rules?.[0];
      if (!pricing) return false;
      const rate = pricing.base_daily_rate || pricing.base_hourly_rate || 0;
      return rate >= min && rate <= max;
    });
  }

  // Filter by inventory
  if (hasInventory === "true") {
    // Need to check if venue has any inventory items
    // This would require a separate query or join - for now skip
  }

  return NextResponse.json({ venues });
}