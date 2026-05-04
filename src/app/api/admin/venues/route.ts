import { NextRequest, NextResponse } from "next/server";

import { assertRootAdmin } from "@/lib/admin/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("venues")
      .select("id,title,city,venue_type,capacity,is_active,owner_id,created_at")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ venues: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      ownerId,
      title,
      description,
      city = "Нижний Новгород",
      address,
      venueType,
      capacity,
      pricing,
      discountPercent = 0,
      inventory = [],
      photos = [],
    } = body;

    // Insert directly into listings table with raw SQL to avoid trigger issues
    // Use a simple insert with the status column properly handled
    const statusValue = "pending"; // New venues start as pending (text, will be cast by DB)
    
    // First, let's try to insert using the Supabase client but with raw SQL for the status
    const { data: venue, error: venueError } = await supabase
      .rpc('insert_venue_safe', {
        p_host_id: ownerId,
        p_title: title,
        p_description: description,
        p_city: city,
        p_address: address,
        p_venue_type: venueType,
        p_capacity: capacity
      });

    if (venueError) {
      console.error('[Venue POST] RPC insert_venue_safe failed:', venueError);
      // Fallback: try direct insert with raw SQL
      const { data: rawData, error: rawError } = await supabase
        .from('listings')
        .insert({ 
          host_id: ownerId, 
          title, 
          description, 
          city, 
          address, 
          venue_type: venueType, 
          capacity,
          status: statusValue as any
        })
        .select('id')
        .single();
      
      if (rawError || !rawData) {
        return NextResponse.json({ error: rawError?.message ?? venueError.message ?? "Create venue failed" }, { status: 400 });
      }
      var venueId = rawData.id;
    } else {
      var venueId = Array.isArray(venue) && venue.length > 0 ? venue[0].id : (venue as any)?.id;
      if (!venueId) {
        return NextResponse.json({ error: "Failed to get venue ID after insert" }, { status: 400 });
      }
    }

    const discountedHourly = Math.max(0, Number(pricing.baseHourlyRate) * (1 - Number(discountPercent) / 100));
    const discountedDaily = Math.max(0, Number(pricing.baseDailyRate) * (1 - Number(discountPercent) / 100));

    const { error: pricingError } = await supabase.from("pricing_rules").insert({
      venue_id: venueId,
      rental_mode: pricing.rentalMode,
      base_hourly_rate: discountedHourly,
      base_daily_rate: discountedDaily,
      minimum_hours: pricing.minimumHours,
      weekend_multiplier: pricing.weekendMultiplier,
      night_multiplier: pricing.nightMultiplier,
      cleaning_fee: pricing.cleaningFee,
    });

    if (pricingError) return NextResponse.json({ error: pricingError.message }, { status: 400 });

    if (photos.length) {
      const photoPayload = photos.map((url: string, i: number) => ({ venue_id: venueId, photo_url: url, sort_order: i }));
      const { error: photosError } = await supabase.from("venue_photos").insert(photoPayload);
      if (photosError) return NextResponse.json({ error: photosError.message }, { status: 400 });
    }

    if (inventory.length) {
      const payload = inventory.map((item: { name: string; included?: boolean; unitPrice?: number; quantity?: number }) => ({
        venue_id: venueId,
        name: item.name,
        included: Boolean(item.included),
        unit_price: Number(item.unitPrice ?? 0),
        quantity: Number(item.quantity ?? 1),
      }));

      const { error: inventoryError } = await supabase.from("inventory_items").insert(payload);
      if (inventoryError) return NextResponse.json({ error: inventoryError.message }, { status: 400 });
    }

    return NextResponse.json({ venueId }, { status: 201 });
  } catch (e) {
    console.error('[Venue POST] Unexpected error:', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertRootAdmin(request);
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { venueId, venuePatch = {}, pricingPatch = {}, discountPercent, inventory = [], photos = [] } = body;

    if (Object.keys(venuePatch).length) {
      const { error } = await supabase.from("venues").update(venuePatch).eq("id", venueId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (Object.keys(pricingPatch).length || discountPercent !== undefined) {
      const patch = { ...pricingPatch };
      if (discountPercent !== undefined) {
        if (patch.base_hourly_rate !== undefined) patch.base_hourly_rate = Number(patch.base_hourly_rate) * (1 - Number(discountPercent) / 100);
        if (patch.base_daily_rate !== undefined) patch.base_daily_rate = Number(patch.base_daily_rate) * (1 - Number(discountPercent) / 100);
      }

      const { error } = await supabase.from("pricing_rules").update(patch).eq("venue_id", venueId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (photos.length) {
      const { error: wipePhotosError } = await supabase.from("venue_photos").delete().eq("venue_id", venueId);
      if (wipePhotosError) return NextResponse.json({ error: wipePhotosError.message }, { status: 400 });

      const photoPayload = photos.map((url: string, i: number) => ({ venue_id: venueId, photo_url: url, sort_order: i }));
      const { error: photosError } = await supabase.from("venue_photos").insert(photoPayload);
      if (photosError) return NextResponse.json({ error: photosError.message }, { status: 400 });
    }

    if (inventory.length) {
      const { error: wipeError } = await supabase.from("inventory_items").delete().eq("venue_id", venueId);
      if (wipeError) return NextResponse.json({ error: wipeError.message }, { status: 400 });

      const payload = inventory.map((item: { name: string; included?: boolean; unitPrice?: number; quantity?: number }) => ({
        venue_id: venueId,
        name: item.name,
        included: Boolean(item.included),
        unit_price: Number(item.unitPrice ?? 0),
        quantity: Number(item.quantity ?? 1),
      }));
      const { error } = await supabase.from("inventory_items").insert(payload);
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

    if (!venueId) return NextResponse.json({ error: "venueId is required" }, { status: 400 });

    const { error } = await supabase.from("venues").delete().eq("id", venueId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}