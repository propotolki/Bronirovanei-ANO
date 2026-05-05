import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { bookingId, amount, description } = body;

    if (!bookingId || !amount) {
      return NextResponse.json({ error: "bookingId and amount are required" }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, guest_id, total_amount")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Get user's VK ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("vk_user_id")
      .eq("id", booking.guest_id)
      .single();

    if (!profile?.vk_user_id) {
      return NextResponse.json({ error: "User VK ID not found" }, { status: 400 });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        booking_id: bookingId,
        provider: "vkpay",
        amount: amount,
        status: "created",
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: paymentError?.message }, { status: 400 });
    }

    // VK Pay initiation data
    // In production, you would use VK Pay SDK with your merchant credentials
    const vkPayData = {
      app_id: process.env.VK_APP_ID,
      order_id: bookingId,
      amount: Math.round(amount * 100), // Convert to cents
      currency: "RUB",
      description: description || "Booking payment",
      user_id: profile.vk_user_id,
      merchant_id: process.env.VK_MERCHANT_ID,
      // In production, add signature here
    };

    return NextResponse.json({
      payment_id: payment.id,
      vkpay: vkPayData,
    });
  } catch (e: any) {
    console.error("[VK Pay Initiate] Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}