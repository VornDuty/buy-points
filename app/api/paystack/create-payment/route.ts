import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

export async function POST(req: Request) {
  try {
    const { userId, coins, currency, amountLocal, email } = await req.json();

    if (!userId || !coins || !amountLocal || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Step 1: Insert pending transaction
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from("transactions")
      .insert([
        {
          user_id: userId,
          type: "deposit",
          coins,
          amount_local: amountLocal,
          currency: "NGN", // ✅ Always store NGN as transaction currency
          status: "pending",
          payment_provider: "paystack",
          recharge_method: "bank",
        },
      ])
      .select()
      .single();

    if (insertError || !transaction) {
      console.error("Transaction insert error:", insertError);
      return NextResponse.json({ error: "Failed to create transaction record." }, { status: 500 });
    }

    // Step 2: Initialize Paystack transaction
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/buy-points/success`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amountLocal * 100), // amount in kobo
        currency: "NGN", // ✅ Always charge in Naira (important)
        callback_url: callbackUrl,
        metadata: {
          transactionId: transaction.id,
          userId,
          coins,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status || !paystackData.data?.authorization_url) {
      console.error("Paystack init failed:", paystackData);
      return NextResponse.json(
        { error: paystackData.message || "Failed to initialize Paystack." },
        { status: 400 }
      );
    }

    // Step 3: Save Paystack reference in Supabase
    await supabaseAdmin
      .from("transactions")
      .update({ reference: paystackData.data.reference })
      .eq("id", transaction.id);

    // Step 4: Return authorization URL
    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (err: any) {
    console.error("Create-payment route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
