import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const vkId = Number(body.vkId);
    const fullName = String(body.fullName ?? "Пользователь");
    const phone = String(body.phone ?? "");
    const intent = body.intent === "host" ? "host" : body.intent === "admin" ? "admin" : "guest";

    if (!vkId) {
      return NextResponse.json({ error: "vkId is required" }, { status: 400 });
    }

    // Проверяем существующего пользователя
    const { data: existing, error: selectError } = await supabase
      .from("app_users")
      .select("id,vk_id,full_name,phone,role,host_access_level,is_blocked")
      .eq("vk_id", vkId)
      .maybeSingle();

    if (selectError) {
      console.error("[session] select error:", selectError);
      return NextResponse.json({ error: `DB select error: ${selectError.message}` }, { status: 500 });
    }

    if (existing?.is_blocked) {
      return NextResponse.json({ error: "Пользователь заблокирован" }, { status: 403 });
    }

    // Создаём нового пользователя
    if (!existing) {
      const { data: created, error: createError } = await supabase
        .from("app_users")
        .insert({
          vk_id: vkId,
          full_name: fullName,
          phone,
          role: intent,
          host_access_level: "basic",
        })
        .select("id,vk_id,full_name,phone,role,host_access_level,is_blocked")
        .single();

      if (createError || !created) {
        console.error("[session] insert error:", createError);
        return NextResponse.json({ error: createError?.message ?? "Failed to create user" }, { status: 500 });
      }

      return NextResponse.json({ user: created }, { status: 201 });
    }

    // Апгрейд роли guest → host
    if (intent === "host" && existing.role === "guest") {
      const { data: upgraded, error: updateError } = await supabase
        .from("app_users")
        .update({ role: "host" })
        .eq("id", existing.id)
        .select("id,vk_id,full_name,phone,role,host_access_level,is_blocked")
        .single();

      if (updateError || !upgraded) {
        console.error("[session] upgrade error:", updateError);
        return NextResponse.json({ error: updateError?.message ?? "Failed to upgrade role" }, { status: 500 });
      }

      return NextResponse.json({ user: upgraded });
    }

    return NextResponse.json({ user: existing });
  } catch (e: any) {
    console.error("[session] fatal error:", e);
    return NextResponse.json({ error: e.message ?? "Internal error" }, { status: 500 });
  }
}
