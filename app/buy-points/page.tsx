"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const COIN_PRICE_USD = 0.01; // 1 point = $0.01

export default function BuyPointsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [coinsBalance, setCoinsBalance] = useState<number | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [rechargeRate, setRechargeRate] = useState<number | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Load user info, profile, wallet, exchange rate
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setUser(user);

      // Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("country")
        .eq("id", user.id)
        .single();
      if (profile) setCountry(profile.country);

      // Wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("coins")
        .eq("user_id", user.id)
        .single();
      if (wallet) setCoinsBalance(wallet.coins);

      // Exchange rate (Nigeria)
      const { data: rate } = await supabase
        .from("exchange_rates")
        .select("recharge_rate")
        .eq("country_name", "Nigeria")
        .single();

      if (rate) setRechargeRate(rate.recharge_rate);
    };

    fetchData();
  }, []);

  // Conversion
  const usdValue = points * COIN_PRICE_USD;
  const ngnValue = rechargeRate ? usdValue * rechargeRate : 0;

  // Always use NGN for Paystack (Paystack default)
  const displayCurrency = "NGN";
  const displayAmount = Math.round(ngnValue);

  // Handle Paystack payment
  const handlePay = async () => {
    if (!user) {
      toast.error("User not found. Please sign in.");
      return;
    }

    if (points < 100) {
      toast.error("Minimum purchase is 100 points.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/paystack/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          coins: points,
          currency: displayCurrency,
          amountLocal: displayAmount,
          email: user.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment");

      // Redirect to Paystack
      window.location.href = data.authorization_url;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
        >
          <FaArrowLeft className="text-zinc-300" />
        </button>
        <div className="w-10" />
      </div>

      {/* Logo */}
      <div className="flex justify-center mb-6">
        <img src="/original-logo.png" alt="Logo" className="h-40 w-auto" />
      </div>

      <h1 className="text-zinc-100 text-lg font-semibold text-center mb-3">
        Buy Points
      </h1>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6 shadow-lg"
      >
        <p className="text-zinc-400 text-sm">Current Balance</p>
        {coinsBalance === null ? (
          <div className="flex items-center space-x-1 mt-4">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></span>
            <span
              className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></span>
            <span
              className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></span>
          </div>
        ) : (
          <>
            <h2 className="text-yellow-400 text-3xl font-bold mt-1">
              {coinsBalance.toLocaleString()} pts
            </h2>
            <p className="text-zinc-500 text-xs mt-1">
              ≈ $
              {(coinsBalance * COIN_PRICE_USD).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              • ₦
              {(
                coinsBalance * COIN_PRICE_USD * (rechargeRate ?? 0)
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </>
        )}
      </motion.div>

      {/* Input */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6 shadow-lg">
        <label className="text-zinc-300 text-sm font-semibold mb-2 block">
          Enter Points
        </label>

        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          placeholder="e.g. 500"
          className="w-full p-3 bg-black border border-zinc-800 rounded-lg text-yellow-400 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />

        {points > 0 && (
          <div className="mt-4 text-center text-zinc-400 text-sm">
            <span className="text-zinc-300 font-medium">
              {points.toLocaleString()}
            </span>{" "}
            points ={" "}
            <span className="text-green-400 font-semibold">
              $
              {usdValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>{" "}
            •{" "}
            <span className="text-yellow-400 font-semibold">
              ₦
              {ngnValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <div className="mt-2 text-xs text-zinc-500 italic">
              (You will be charged in Naira through Paystack)
            </div>
          </div>
        )}
      </div>

      {/* Pay Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handlePay}
        disabled={loading}
        className={`w-full py-4 ${
          points < 100
            ? "bg-zinc-700 cursor-not-allowed"
            : "bg-yellow-400 hover:bg-yellow-300"
        } text-black font-bold rounded-xl text-lg shadow-lg transition`}
      >
        {points < 100
          ? "Enter at least 100 points"
          : loading
          ? "Processing..."
          : `Pay ₦${ngnValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
      </motion.button>

      <p className="text-zinc-500 text-xs text-center mt-4">
        Your payment is 100% secure and handled by Paystack.
      </p>
    </div>
  );
}
