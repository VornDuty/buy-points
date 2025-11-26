"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.user) {
        toast.error(error?.message || "Invalid email or password", {
          style: {
            background: "#1f1f1f",
            color: "#fff",
            border: "1px solid #ff3b3b",
          },
        });
        return;
      }

      toast.success("Login successful! Redirecting...", {
        style: {
          background: "#1f1f1f",
          color: "#fff",
          border: "1px solid #22c55e",
        },
      });

      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      toast.error("Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpRedirect = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    const appDeepLink = "vornduty://";
    const androidStore = "https://play.google.com/store/apps/details?id=com.vornduty.app";
    const iosStore = "https://apps.apple.com/app/vornduty/id6753819191"; // replace X with your App Store ID when ready


    // Try opening the app
    window.location.href = appDeepLink;

    // Fallback after 2s — go to store if app not installed
    setTimeout(() => {
      if (/android/.test(userAgent)) {
        window.location.href = androidStore;
      } else if (/iphone|ipad|ipod/.test(userAgent)) {
        window.location.href = iosStore;
      } else {
        toast("Please use your mobile device to sign up.", {
          icon: "📱",
          style: { background: "#1f1f1f", color: "#fff" },
        });
      }
    }, 2000);
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-black via-zinc-900 to-zinc-800 text-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-zinc-900/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-zinc-800"
        >
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-extrabold text-center mb-8"
          >
            <span className="text-red-600">WELCOME </span>
            <span className="text-yellow-400">BACK</span>
          </motion.h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-zinc-400 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800/80 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800/80 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-md font-semibold transition ${
                loading
                  ? "bg-red-900 cursor-not-allowed"
                  : "bg-red-700 hover:bg-red-800"
              }`}
            >
              {loading ? "Logging in..." : "Log In"}
            </motion.button>
          </form>

          <div className="text-center mt-6">
            <a
              href=""
              className="text-sm text-yellow-400 hover:text-yellow-300 underline"
            >
              Forgot Password?
            </a>
          </div>

          <p className="text-zinc-400 text-sm text-center mt-6">
            Don’t have an account?{" "}
            <button
              onClick={handleSignUpRedirect}
              className="text-white font-semibold hover:underline"
            >
              Sign up on the app
            </button>
          </p>
        </motion.div>
      </div>
    </>
  );
}
