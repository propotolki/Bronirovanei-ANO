import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const vkId = Number(body.vkId);
    const fullName = String(body.fullName ?? "Пользователь");
    const phone = String(body.phone ?? "");
    const intent = body.intent === "host" ? "host" : "guest";

    if (!vkId) return NextResponse.json({ error: "vkId is required" }, { status: 400 });

    const { data: existing } = await supabase
      .from("app_users")
      .select("id,vk_id,role,is_blocked")
      .eq("vk_id", vkId)
      .maybeSingle();

    if (existing?.is_blocked) {
      return NextResponse.json({ error: "Пользователь заблокирован" }, { status: 403 });
    }

    if (!existing) {
      const { data: created, error: createError } = await supabase
        .from("app_users")
        .insert({ vk_id: vkId, full_name: fullName, phone, role: intent })
        .select("id,vk_id,role,is_blocked")
        .single();

      if (createError || !created) {
        return NextResponse.json({ error: createError?.message ?? "Failed to create user" }, { status: 400 });
      }

      return NextResponse.json({ user: created }, { status: 201 });
    }

    if (intent === "host" && existing.role === "guest") {
      const { data: upgraded, error: updateError } = await supabase
        .from("app_users")
        .update({ role: "host" })
        .eq("id", existing.id)
        .select("id,vk_id,role,is_blocked")
        .single();

      if (updateError || !upgraded) {
        return NextResponse.json({ error: updateError?.message ?? "Failed to upgrade role" }, { status: 400 });
      }

      return NextResponse.json({ user: upgraded });
    }

    return NextResponse.json({ user: existing });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
