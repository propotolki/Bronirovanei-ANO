import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, guestId } = body;

    const supabase = createServerSupabaseClient();

    const { data: booking, error: getError } = await supabase
      .from("bookings")
      .select("id,guest_id,status")
      .eq("id", bookingId)
      .single();

    if (getError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.guest_id !== guestId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ ok: true, status: "cancelled" });
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, status: "cancelled" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
