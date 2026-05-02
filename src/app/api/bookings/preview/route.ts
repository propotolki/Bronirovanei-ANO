import { NextRequest, NextResponse } from "next/server";

import { calculateBookingCost } from "@/lib/pricing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RentalMode } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venueId, startAt, endAt, rentalMode, inventoryTotal = 0, isWeekend = false, hasNightHours = false } = body;

    const supabase = createServerSupabaseClient();
    const { data: pricingRule, error } = await supabase
      .from("pricing_rules")
      .select("venue_id,rental_mode,currency,base_hourly_rate,base_daily_rate,minimum_hours,weekend_multiplier,night_multiplier,cleaning_fee")
      .eq("venue_id", venueId)
      .single();

    if (error || !pricingRule) {
      return NextResponse.json({ error: "Pricing rule not found" }, { status: 404 });
    }

    const breakdown = calculateBookingCost({
      slot: { startAt: new Date(startAt), endAt: new Date(endAt) },
      rentalMode: rentalMode as RentalMode,
      pricingRule: {
        venueId: pricingRule.venue_id,
        rentalMode: pricingRule.rental_mode,
        currency: pricingRule.currency,
        baseHourlyRate: Number(pricingRule.base_hourly_rate),
        baseDailyRate: Number(pricingRule.base_daily_rate),
        minimumHours: pricingRule.minimum_hours,
        weekendMultiplier: Number(pricingRule.weekend_multiplier),
        nightMultiplier: Number(pricingRule.night_multiplier),
        cleaningFee: Number(pricingRule.cleaning_fee),
      },
      inventoryTotal,
      isWeekend,
      hasNightHours,
    });

    return NextResponse.json({ breakdown });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
