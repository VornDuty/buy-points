"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("reference");
    if (!ref) {
      setLoading(false);
      setMessage("Transaction reference missing.");
      return;
    }

    setReference(ref);

    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/paystack/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref }),
        });

        const data = await res.json();

        if (!res.ok) {
          setSuccess(false);
          setMessage(data.error || "Payment verification failed.");
          toast.error(data.error || "Payment verification failed.");
        } else if (data.success) {
          setSuccess(true);
          setMessage(data.message || "Payment successful! Your wallet has been updated.");
          toast.success("Payment verified successfully!");
        } else if (data.alreadyVerified) {
          setSuccess(true);
          setMessage("This transaction has already been verified.");
          toast.success("Transaction already verified.");
        } else {
          setSuccess(false);
          setMessage(data.message || "Payment failed.");
          toast.error(data.message || "Payment failed.");
        }

        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } catch (err: any) {
        console.error("Verify payment error:", err);
        setSuccess(false);
        setMessage(err.message || "Payment verification failed.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-5">
      <AnimatePresence>
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-400">Verifying your payment...</p>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            {success ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4"
              >
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-20 h-20 border-4 border-red-500 rounded-full flex items-center justify-center mb-4"
              >
                <span className="text-red-500 text-2xl font-bold">✕</span>
              </motion.div>
            )}

            <h1 className={`text-2xl font-bold mb-4 ${success ? "text-yellow-400" : "text-red-500"}`}>
              {success ? "Payment Successful!" : "Payment Failed"}
            </h1>

            <p className="text-zinc-300 text-center mb-2">{message}</p>

            {reference && (
              <p className="text-zinc-400 text-sm text-center">
                Transaction Reference:{" "}
                <span className="text-yellow-400">{reference}</span>
              </p>
            )}

            <p className="text-zinc-500 text-xs mt-4 text-center">
              {success
                ? "You will be redirected to your dashboard shortly."
                : "Please try again or contact support."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
