import { NextRequest, NextResponse } from "next/server";

import { mapAccessLevelToPlan, PLAN_FEATURES } from "@/lib/tariffs";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function isTrialActive(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() > Date.now();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const vkId = Number(request.headers.get("x-vk-id") ?? 0);

    if (!vkId) return NextResponse.json({ error: "x-vk-id is required" }, { status: 400 });

    const { data: user } = await supabase
      .from("app_users")
      .select("id,role,is_blocked,host_access_level")
      .eq("vk_id", vkId)
      .maybeSingle();

    if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    if (user.is_blocked) return NextResponse.json({ error: "Пользователь заблокирован" }, { status: 403 });
    if (user.role !== "host" && user.role !== "admin") {
      return NextResponse.json({ error: "Недостаточно прав для размещения площадки" }, { status: 403 });
    }

    const { count: venueCount } = await supabase
      .from("venues")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id);

    const { data: trial } = await supabase
      .from("host_trial_usage")
      .select("trial_ends_at,consumed")
      .eq("user_id", user.id)
      .maybeSingle();

    const basePlan = mapAccessLevelToPlan(user.host_access_level);
    const trialActive = !trial?.consumed && isTrialActive(trial?.trial_ends_at);
    const effectivePlan = trialActive ? "advanced" : basePlan;
    const planFeatures = PLAN_FEATURES[effectivePlan];

    if ((venueCount ?? 0) >= planFeatures.venueLimit) {
      return NextResponse.json(
        { error: `Лимит площадок для тарифа ${effectivePlan}: ${planFeatures.venueLimit}` },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      description = "",
      city = "Нижний Новгород",
      address = "",
      venueType = "loft",
      capacity = 10,
      photos = [],
      inventory = [],
      workingHours = "08:00-23:00",
      pricing,
    } = body;

    if (!title || !pricing) {
      return NextResponse.json({ error: "title and pricing are required" }, { status: 400 });
    }

    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .insert({
        owner_id: user.id,
        title,
        description: `${description}\nРабочее время: ${workingHours}`,
        city,
        address,
        venue_type: venueType,
        capacity: Number(capacity),
      })
      .select("id")
      .single();

    if (venueError || !venue) return NextResponse.json({ error: venueError?.message ?? "Create venue failed" }, { status: 400 });

    const { error: priceError } = await supabase.from("pricing_rules").insert({
      venue_id: venue.id,
      rental_mode: pricing.rentalMode,
      base_hourly_rate: Number(pricing.baseHourlyRate ?? 0),
      base_daily_rate: Number(pricing.baseDailyRate ?? 0),
      minimum_hours: Number(pricing.minimumHours ?? 1),
      weekend_multiplier: Number(pricing.weekendMultiplier ?? 1),
      night_multiplier: Number(pricing.nightMultiplier ?? 1),
      cleaning_fee: Number(pricing.cleaningFee ?? 0),
    });

    if (priceError) return NextResponse.json({ error: priceError.message }, { status: 400 });

    if (photos.length) {
      await supabase.from("venue_photos").insert(photos.map((u: string, i: number) => ({ venue_id: venue.id, photo_url: u, sort_order: i })));
    }

    if (inventory.length) {
      await supabase.from("inventory_items").insert(
        inventory.map((item: { name: string; unitPrice?: number; quantity?: number; included?: boolean }) => ({
          venue_id: venue.id,
          name: item.name,
          unit_price: Number(item.unitPrice ?? 0),
          quantity: Number(item.quantity ?? 1),
          included: Boolean(item.included),
        })),
      );
    }

    return NextResponse.json({ venueId: venue.id, effectivePlan, trialActive }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
