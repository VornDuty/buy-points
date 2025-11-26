import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: "Missing Paystack reference" }, { status: 400 });
    }

    // ✅ Step 0: Check transaction status in Supabase first
    const { data: existingTransaction, error: trxError } = await supabaseAdmin
      .from("transactions")
      .select("status, coins, user_id")
      .eq("reference", reference)
      .single();

    if (trxError || !existingTransaction) {
      console.error("Transaction not found:", trxError);
      return NextResponse.json({ error: "Transaction not found" }, { status: 400 });
    }

    if (existingTransaction.status === "success") {
      // Already verified, do not credit again
      return NextResponse.json({
        success: true,
        message: "Transaction already verified",
        data: { reference, coins: existingTransaction.coins },
      });
    }

    // ✅ Step 1: Verify payment with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      console.error("Paystack verification failed:", paystackData);
      return NextResponse.json(
        { error: paystackData.message || "Verification failed" },
        { status: 400 }
      );
    }

    const { status, amount, currency, metadata } = paystackData.data;

    // ✅ Step 2: Update transaction only if successful
    const trxUpdate = await supabaseAdmin
      .from("transactions")
      .update({
        status: status === "success" ? "success" : "failed",
        amount_local: amount / 100, // convert back from kobo
        currency,
      })
      .eq("reference", reference);

    if (trxUpdate.error) {
      console.error("Failed to update transaction:", trxUpdate.error);
      return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
    }

    // ✅ Step 3: Wallet trigger will automatically update coins only once
    return NextResponse.json({
      success: status === "success",
      message: status === "success" ? "Payment verified successfully" : "Payment failed",
      data: metadata,
    });
  } catch (err: any) {
    console.error("Verify-payment route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
