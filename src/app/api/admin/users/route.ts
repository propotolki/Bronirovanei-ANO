import { NextRequest, NextResponse } from "next/server";

import { assertRootAdmin } from "@/lib/admin/auth";
import { AppUserRole, HostAccessLevel } from "@/lib/admin/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("app_users")
      .select("id,vk_id,full_name,phone,role,host_access_level,is_blocked,created_at")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ users: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { vkId, fullName, phone, role = "guest", hostAccessLevel = "basic" } = body as {
      vkId: number;
      fullName: string;
      phone?: string;
      role?: AppUserRole;
      hostAccessLevel?: HostAccessLevel;
    };

    const { data, error } = await supabase
      .from("app_users")
      .insert({ vk_id: vkId, full_name: fullName, phone, role, host_access_level: hostAccessLevel })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ userId: data?.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { userId, patch } = body;

    const { error } = await supabase.from("app_users").update(patch).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const { error } = await supabase.from("app_users").delete().eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
