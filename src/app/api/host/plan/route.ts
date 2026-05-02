import { NextRequest, NextResponse } from "next/server";

import { mapAccessLevelToPlan, PLAN_FEATURES } from "@/lib/tariffs";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const vkId = Number(request.headers.get("x-vk-id") ?? 0);

  if (!vkId) return NextResponse.json({ error: "x-vk-id is required" }, { status: 400 });

  const { data: user } = await supabase
    .from("app_users")
    .select("id,host_access_level")
    .eq("vk_id", vkId)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  const basePlan = mapAccessLevelToPlan(user.host_access_level);
  const { data: trial } = await supabase
    .from("host_trial_usage")
    .select("trial_ends_at,consumed")
    .eq("user_id", user.id)
    .maybeSingle();

  const trialActive = Boolean(trial && !trial.consumed && new Date(trial.trial_ends_at).getTime() > Date.now());
  const effectivePlan = trialActive ? "advanced" : basePlan;

  const { count: venuesCount } = await supabase
    .from("venues")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const { count: promotionsUsed } = await supabase
    .from("host_promotion_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return NextResponse.json({
    basePlan,
    effectivePlan,
    features: PLAN_FEATURES[effectivePlan],
    venuesCount: venuesCount ?? 0,
    promotionsUsed: promotionsUsed ?? 0,
    trial,
  });
}
