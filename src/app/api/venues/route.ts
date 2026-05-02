import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("venues")
    .select("id,title,description,city,address,venue_type,capacity,is_active,pricing_rules(base_hourly_rate,base_daily_rate,rental_mode),venue_photos(photo_url,sort_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ venues: data ?? [] });
}
