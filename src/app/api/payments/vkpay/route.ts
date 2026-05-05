import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface VKPayNotification {
  notification_type: string;
  app_id: number;
  receiver_id: number;
  sender_id: number;
  date: number;
  signature: string;
  merchant_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  order_id: string;
  custom_data?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VKPayNotification = await request.json();
    
    // Verify signature (in production, verify with VK secret key)
    // For now, we'll skip verification
    
    const supabase = createServerSupabaseClient();
    
    // Find booking by order_id
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, total_amount, guest_id")
      .eq("id", body.order_id)
      .single();
    
    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    
    // Create or update payment record
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("provider_payment_id", body.transaction_id)
      .single();
    
    if (existingPayment) {
      // Update existing payment
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "paid",
          raw_payload: body,
        })
        .eq("provider_payment_id", body.transaction_id);
      
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    } else {
      // Create new payment
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          booking_id: booking.id,
          provider: "vkpay",
          provider_payment_id: body.transaction_id,
          amount: body.amount / 100, // VK Pay sends in cents
          status: "paid",
          raw_payload: body,
        });
      
      if (paymentError) {
        return NextResponse.json({ error: paymentError.message }, { status: 400 });
      }
    }
    
    // Update booking status to confirmed
    const { error: bookingUpdateError } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", booking.id);
    
    if (bookingUpdateError) {
      console.error("Failed to update booking status:", bookingUpdateError);
    }
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[VK Pay Webhook] Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}