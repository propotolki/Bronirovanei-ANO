import { NextRequest, NextResponse } from "next/server";

import { calculateBookingCost } from "@/lib/pricing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RentalMode } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venueId, guestId, startAt, endAt, rentalMode, inventoryTotal = 0, isFree = false } = body;

    const supabase = createServerSupabaseClient();

    const { data: hasConflict, error: conflictError } = await supabase.rpc("check_booking_conflict", {
      p_venue_id: venueId,
      p_start_at: startAt,
      p_end_at: endAt,
    });

    if (conflictError) {
      return NextResponse.json({ error: conflictError.message }, { status: 500 });
    }

    if (hasConflict) {
      return NextResponse.json({ error: "Requested slot is not available" }, { status: 409 });
    }

    let totalAmount = 0;
    if (!isFree) {
      const { data: pricingRule, error } = await supabase
        .from("pricing_rules")
        .select("venue_id,rental_mode,currency,base_hourly_rate,base_daily_rate,minimum_hours,weekend_multiplier,night_multiplier,cleaning_fee")
        .eq("venue_id", venueId)
        .single();

      if (error || !pricingRule) {
        return NextResponse.json({ error: "Pricing rule not found" }, { status: 404 });
      }

      const cost = calculateBookingCost({
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
      });

      totalAmount = cost.totalAmount;
    }

    const { data: booking, error: createError } = await supabase
      .from("bookings")
      .insert({
        venue_id: venueId,
        guest_id: guestId,
        start_at: startAt,
        end_at: endAt,
        status: "pending",
        is_free: isFree,
        total_amount: totalAmount,
      })
      .select("id,venue_id,guest_id,start_at,end_at,status,is_free,total_amount,created_at")
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
