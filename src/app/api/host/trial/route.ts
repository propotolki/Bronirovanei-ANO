import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const vkId = Number(request.headers.get("x-vk-id") ?? 0);

  if (!vkId) return NextResponse.json({ error: "x-vk-id is required" }, { status: 400 });

  const { data: user } = await supabase.from("app_users").select("id").eq("vk_id", vkId).maybeSingle();
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  const { data: existing } = await supabase.from("host_trial_usage").select("id").eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: "Триал уже использован" }, { status: 409 });

  const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("host_trial_usage")
    .insert({ user_id: user.id, trial_ends_at: endsAt, consumed: false })
    .select("id,trial_started_at,trial_ends_at,consumed")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ trial: data }, { status: 201 });
}
