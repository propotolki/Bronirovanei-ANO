import { NextRequest, NextResponse } from "next/server";

import { mapAccessLevelToPlan, PLAN_FEATURES } from "@/lib/tariffs";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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
  const promotionLimit = PLAN_FEATURES[effectivePlan].promotionLimit;

  if (promotionLimit <= 0) {
    return NextResponse.json({ error: "На вашем тарифе продвижение недоступно" }, { status: 403 });
  }

  const body = await request.json();
  const venueId = String(body.venueId ?? "");
  const promotionType = String(body.promotionType ?? "");

  if (!venueId || !["boost_search", "home_feature", "highlight"].includes(promotionType)) {
    return NextResponse.json({ error: "Некорректные параметры продвижения" }, { status: 400 });
  }

  const { count: used } = await supabase
    .from("host_promotion_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((used ?? 0) >= promotionLimit) {
    return NextResponse.json({ error: "Лимит продвижений исчерпан" }, { status: 403 });
  }

  const { error } = await supabase
    .from("host_promotion_usage")
    .insert({ user_id: user.id, venue_id: venueId, promotion_type: promotionType });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, used: (used ?? 0) + 1, limit: promotionLimit });
}
