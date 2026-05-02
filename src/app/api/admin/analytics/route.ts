import { NextRequest, NextResponse } from "next/server";

import { assertRootAdmin } from "@/lib/admin/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");
    const userId = searchParams.get("userId");

    const { data: summary, error: summaryError } = await supabase.rpc("admin_summary_analytics");
    if (summaryError) return NextResponse.json({ error: summaryError.message }, { status: 400 });

    let venueStats = null;
    if (venueId) {
      const { data, error } = await supabase.rpc("admin_venue_analytics", { p_venue_id: venueId });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      venueStats = data;
    }

    let userStats = null;
    if (userId) {
      const { data, error } = await supabase.rpc("admin_user_analytics", { p_user_id: userId });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      userStats = data;
    }

    const { data: inventoryUsage } = await supabase
      .from("inventory_usage_stats")
      .select("inventory_name,usage_count,total_revenue")
      .order("usage_count", { ascending: false });

    const { data: hourlyActivity } = await supabase
      .from("hourly_activity_stats")
      .select("hour_of_day,bookings_count,total_revenue")
      .order("hour_of_day", { ascending: true });

    return NextResponse.json({
      summary,
      venueStats,
      userStats,
      inventoryUsage: inventoryUsage ?? [],
      hourlyActivity: hourlyActivity ?? [],
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
