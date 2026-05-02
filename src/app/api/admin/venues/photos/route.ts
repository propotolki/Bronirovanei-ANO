import { NextRequest, NextResponse } from "next/server";

import { assertRootAdmin } from "@/lib/admin/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type VenuePhotoRow = {
  id: string;
  venue_id: string;
  photo_url: string;
  sort_order: number;
};

export async function GET(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");

    if (!venueId) {
      return NextResponse.json({ error: "venueId is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("venue_photos")
      .select("id,venue_id,photo_url,sort_order")
      .eq("venue_id", venueId)
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ photos: (data ?? []) as VenuePhotoRow[] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const formData = await request.formData();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const venueId = String(formData.get("venueId") ?? "");
    if (!venueId) {
      return NextResponse.json({ error: "venueId is required" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${venueId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const supabase = createServerSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from("venue-photos")
      .upload(filePath, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: publicData } = supabase.storage.from("venue-photos").getPublicUrl(filePath);
    const photoUrl = publicData.publicUrl;

    const { data: lastPhoto } = await supabase
      .from("venue_photos")
      .select("sort_order")
      .eq("venue_id", venueId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = Number(lastPhoto?.sort_order ?? -1) + 1;
    const { data: inserted, error: insertError } = await supabase
      .from("venue_photos")
      .insert({ venue_id: venueId, photo_url: photoUrl, sort_order: nextSortOrder })
      .select("id,venue_id,photo_url,sort_order")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ photo: inserted }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const venueId = String(body.venueId ?? "");
    const orderedPhotoIds = Array.isArray(body.orderedPhotoIds) ? body.orderedPhotoIds as string[] : [];

    if (!venueId || orderedPhotoIds.length === 0) {
      return NextResponse.json({ error: "venueId and orderedPhotoIds are required" }, { status: 400 });
    }

    for (let i = 0; i < orderedPhotoIds.length; i += 1) {
      const photoId = orderedPhotoIds[i];
      const { error } = await supabase
        .from("venue_photos")
        .update({ sort_order: i })
        .eq("id", photoId)
        .eq("venue_id", venueId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

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

    const venueId = searchParams.get("venueId");
    const photoId = searchParams.get("photoId");

    if (!venueId || !photoId) {
      return NextResponse.json({ error: "venueId and photoId are required" }, { status: 400 });
    }

    const { error } = await supabase.from("venue_photos").delete().eq("id", photoId).eq("venue_id", venueId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
