"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaHistory, FaHeadset, FaSignOutAlt } from "react-icons/fa";
import Image from "next/image";

const COIN_PRICE_USD = 0.01; // 1 point = $0.01

type Profile = {
  id: string;
  username: string;
  country?: string | null;
  avatar_url?: string | null;
};

type Wallet = {
  user_id: string;
  coins: number;
  updated_at?: string;
};

type ExchangeRate = {
  country_name: string;
  recharge_rate: number; // numeric(10,4)
};

type TransactionRow = {
  id: string;
  user_id: string | null;
  type: "deposit" | "withdraw";
  coins: number;
  amount_local: number;
  currency: string;
  status: "pending" | "success" | "failed";
  created_at: string | null;
  reference?: string | null;
  withdraw_method?: string | null;
  // ...other fields if needed
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [txOpen, setTxOpen] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  // fetch user, profile, wallet, exchange rate and transactions
  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // profile
        const { data: profileData, error: pErr } = await supabase
          .from("profiles")
          .select("id, username, country, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (pErr) console.error("profile err", pErr);
        if (!mounted) return;
        setProfile(profileData || null);

        // wallet
        const { data: walletData, error: wErr } = await supabase
          .from("wallets")
          .select("user_id, coins, updated_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) console.error("wallet err", wErr);
        if (!mounted) return;
        setWallet(walletData || { user_id: user.id, coins: 0 });

        // exchange rate lookup by country_name if country exists
        if (profileData?.country) {
          const { data: exchangeData, error: eErr } = await supabase
            .from("exchange_rates")
            .select("country_name, recharge_rate")
            .ilike("country_name", profileData.country)
            .limit(1)
            .maybeSingle();

          if (eErr) console.error("exchange err", eErr);
          if (!mounted) return;
          setRate(exchangeData || null);
        }

        // transactions (latest 50)
        const { data: txData, error: txErr } = await supabase
          .from("transactions")
          .select(
            "id,user_id,type,coins,amount_local,currency,status,created_at,reference,withdraw_method"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (txErr) console.error("tx err", txErr);
        if (!mounted) return;
        setTransactions((txData as TransactionRow[]) || []);
      } catch (err) {
        console.error("loadAll err", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, [router]);

  // refresh transactions & wallet
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const [{ data: walletData }, { data: txData }] = await Promise.all([
        supabase.from("wallets").select("user_id, coins, updated_at").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("transactions")
          .select("id,user_id,type,coins,amount_local,currency,status,created_at,reference,withdraw_method")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (walletData) setWallet(walletData as Wallet);
      if (txData) setTransactions(txData as TransactionRow[]);
    } catch (e) {
      console.error("refresh err", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const statusColor = (status: string) => {
    if (status === "success") return "#22c55e"; // green
    if (status === "pending") return "#f59e0b"; // yellow
    return "#f87171"; // red
  };

  const formatMoney = (val: number | null | undefined, currency = "USD") => {
    if (val == null) return "-";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(Number(val));
    } catch {
      return `${val} ${currency}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white relative overflow-hidden">
        {/* Sparkle pulse behind text */}
        <motion.div
          className="absolute w-32 h-32 rounded-full bg-yellow-400/20 filter blur-2xl"
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        />

        {/* Animated Loading Text */}
        <motion.div
          initial={{ y: 0, scale: 1 }}
          animate={{ y: [0, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
          className="text-3xl font-extrabold text-yellow-400 z-10 mb-4"
        >
          Loading Dashboard…
        </motion.div>

        {/* Bouncing Arrow */}
        <motion.div
          animate={{ y: [0, 15, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.2 }}
          className="text-yellow-400 text-4xl z-10"
        >
          ↓
        </motion.div>
      </div>
    );
  }

  const points = wallet?.coins ?? 0;
  const usdValue = points * COIN_PRICE_USD;
  const showLocal =
    !!profile?.country && profile.country.toLowerCase().includes("nig");
  const localRate = rate ? Number(rate.recharge_rate) : undefined;
  const localValue = localRate ? usdValue * localRate : undefined;

  // FAQ content
  const faqs = [
    {
      q: "How do I buy points?",
      a: "Tap Buy Points → choose a bundle → complete payment with Paystack. Points are credited instantly after successful payment.",
    },
    {
      q: "How long do transactions take?",
      a: "Most payments are processed instantly. Bank transfers may take 1–24 hours depending on your bank and provider.",
    },
    {
      q: "Can I withdraw points to my bank?",
      a: "Withdrawals are supported for eligible users and may require identity verification. Check the Support section for current options.",
    },
    {
      q: "What if my transaction fails?",
      a: "If a payment fails, it will be marked as failed in your transactions. Contact Support with the transaction reference and we’ll investigate.",
    },
  ];

  // Animated particle generator (subtle golden dots)
  const particles = Array.from({ length: 18 });

  return (
    <div className="min-h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Animated background particles */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {particles.map((_, i) => {
          const left = Math.random() * 100;
          const size = 6 + Math.random() * 18;
          const delay = Math.random() * 6;
          const duration = 8 + Math.random() * 10;
          const opacity = 0.08 + Math.random() * 0.22;
          return (
            <motion.div
              key={i}
              initial={{ y: -50, x: `${left}%`, opacity: 0 }}
              animate={{ y: ["-10vh", "110vh"], opacity: [opacity, opacity * 0.6, 0.0] }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration,
                delay,
              }}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: "-5vh",
                width: size,
                height: size,
                borderRadius: 9999,
                background:
                  "radial-gradient(circle at 30% 30%, rgba(250,205,65,1), rgba(250,205,65,0.6), rgba(255,255,255,0))",
                filter: "blur(6px)",
                transform: "translateZ(0)",
                mixBlendMode: "screen",
                opacity,
              }}
            />
          );
        })}
      </div>

      {/* Header area */}
      <header className="w-full max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                {profile?.avatar_url ? (
                <Image
                    src={
                    profile.avatar_url.startsWith("http") ||
                    profile.avatar_url.startsWith("https")
                        ? profile.avatar_url
                        : "/original-logo.png" // fallback if image isn't a remote URL
                    }
                    alt={profile.username || "User"}
                    fill
                    style={{ objectFit: "cover" }}
                />
                ) : (
                <Image
                    src="/original-logo.png"
                    alt="Default Avatar"
                    fill
                    style={{ objectFit: "cover" }}
                />
                )}
            </div>

            {/* Username Badge */}
            <div className="border border-yellow-500/30 text-yellow-400 text-sm font-semibold px-3 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
                {profile?.username || "Guest"}
            </div>
            </div>


            <div>
              <div className="text-sm text-zinc-400">Welcome back</div>
              <div className="text-lg font-bold text-white">{profile?.username ?? "User"}</div>
            </div>
          </div>

          {/* Logout Button */}
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
        aria-label="Logout"
      >
        <FaSignOutAlt className="text-zinc-300" />
      </button>

      {/* Confirm Logout Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-[90%] max-w-sm text-center shadow-xl">
            <h2 className="text-zinc-100 text-lg font-bold">Confirm Logout</h2>
            <p className="text-zinc-400 mt-2">
              Are you sure you want to log out?
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleLogout();
                }}
                className="flex-1 py-2 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </header>

      {/* Balance card */}
      <section className="w-full max-w-md mx-auto px-4 mt-4">
        <div className="bg-[#0b0b0b] border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-zinc-400">Balance</div>
              <div className="mt-1 text-3xl font-extrabold text-[#FACC15]">
                {points.toLocaleString()} <span className="text-sm text-zinc-300 font-medium">points</span>
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                ≈ {formatMoney(usdValue, "USD")}
                {showLocal && localValue !== undefined && (
                  <>
                    {" • "}
                    <span>{formatMoney(localValue, "NGN")}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-zinc-400">Updated</div>
              <div className="text-sm text-zinc-300">{wallet?.updated_at ? new Date(wallet.updated_at).toLocaleString() : "—"}</div>
            </div>
          </div>

          {/* action buttons row */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => router.push("/buy-points")}
              className="flex-1 rounded-lg py-3 bg-linear-to-r from-[#ff5c5c] to-[#ffb347] text-black font-semibold shadow-md"
            >
              <div className="flex items-center justify-center gap-2">
                <FaShoppingCart /> Buy Points
              </div>
            </button>

            <button
              onClick={() => setTxOpen(true)}
              className="w-16 h-16 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 shadow-sm"
              title="Transactions"
            >
              <FaHistory className="w-6 h-6" />
            </button>

          </div>
        </div>
      </section>

      {/* Action cards list (stacked mobile) */}
      <main className="w-full max-w-md mx-auto px-4 mt-6 mb-4 space-y-3">
        <button
          onClick={() => router.push("/buy-points")}
          className="w-full flex items-center justify-between p-4 bg-linear-to-r from-red-600 to-yellow-500 rounded-xl shadow-lg"
        >
          <div>
            <div className="text-sm text-zinc-50 font-semibold">Buy Points</div>
            <div className="text-xs text-zinc-100/80 mt-1">Fast, secure payments via Paystack</div>
          </div>
          <div className="text-2xl">🪙</div>
        </button>

        <button
          onClick={() => setTxOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-[#0f0f12] rounded-xl border border-zinc-800 shadow-sm"
        >
          <div>
            <div className="text-sm text-zinc-50 font-semibold">Transaction History</div>
            <div className="text-xs text-zinc-400 mt-1">View your recent purchases and statuses</div>
          </div>
          <FaHistory className="text-yellow-400 text-xl" />
        </button>

        <div className="w-full bg-[#0f0f12] rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-50 font-semibold">Support / FAQ</div>
              <div className="text-xs text-zinc-400 mt-1">Answers to common questions</div>
            </div>
            <FaHeadset className="text-zinc-300 text-xl" />
          </div>

          {/* FAQ accordion */}
          <div className="mt-3 space-y-2">
            {faqs.map((f, idx) => {
              const open = faqOpenIndex === idx;
              return (
                <div key={idx} className="w-full">
                  <button
                    onClick={() => setFaqOpenIndex(open ? null : idx)}
                    className="w-full text-left py-3 px-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">{f.q}</div>
                      {open && <div className="text-xs mt-1 text-zinc-300">{f.a}</div>}
                    </div>
                    <div className="text-zinc-400">{open ? "−" : "+"}</div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer pinned to bottom */}
      <footer className="w-full mt-auto border-t border-zinc-800 text-center py-4 text-xs text-zinc-500">
        © {new Date().getFullYear()} Vornduty • All Rights Reserved
      </footer>

      {/* Transactions modal */}
      <AnimatePresence>
        {txOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTxOpen(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
              initial={{ y: "50%" }}
              animate={{ y: 0 }}
              exit={{ y: "50%" }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-full max-w-md bg-[#0b0b0b] rounded-2xl p-4 border border-zinc-800 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-zinc-400">Transactions</div>
                    <div className="text-lg font-bold text-white">Recent activity</div>
                  </div>
                  <button
                    onClick={() => setTxOpen(false)}
                    className="text-zinc-400 text-sm px-3 py-1"
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-[55vh] overflow-y-auto space-y-3 pb-4">
                  {transactions.length === 0 ? (
                    <div className="text-center text-zinc-400 py-10">No transactions yet.</div>
                  ) : (
                    transactions.map((item) => {
                      const arrow = item.type === "deposit" ? "↓" : "↑";
                      const isCryptoWithdraw = item.type === "withdraw" && item.withdraw_method === "crypto";
                      const usdValueTx = isCryptoWithdraw ? (item.coins ?? item.coins) * COIN_PRICE_USD : null;
                      return (
                        <div key={item.id} className="bg-[#121212] rounded-lg p-3 border border-zinc-800 flex items-start">
                          <div className="flex flex-col">
                            <div className="text-sm font-bold text-zinc-100">{arrow} {item.type === "deposit" ? "Deposit" : "Withdraw"}</div>
                            <div className="text-xs text-zinc-400 mt-1">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</div>
                          </div>

                          <div className="flex-1" />

                          <div className="text-right">
                            <div className="text-sm font-bold text-zinc-100">{(item.coins ?? 0).toLocaleString()} points</div>
                            <div className="text-xs text-zinc-400 mt-1">
                              {isCryptoWithdraw ? formatMoney(usdValueTx ?? 0, "USD") : formatMoney(Number(item.amount_local ?? 0), item.currency ?? "USD")}
                            </div>
                            <div style={{ color: statusColor(item.status) }} className="text-xs mt-1">
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-3 flex gap-3">
                  <button onClick={() => { setTxOpen(false); handleRefresh(); }} className="flex-1 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">Refresh</button>
                  <button onClick={() => setTxOpen(false)} className="flex-1 py-3 rounded-lg bg-linear-to-r from-[#ff5c5c] to-[#ffb347] text-black font-semibold">Close</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
