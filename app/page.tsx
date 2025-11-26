"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function WelcomePage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-linear-to-b from-[#0d0d15] via-[#141420] to-[#1a1a2e] text-white font-sans overflow-hidden">
      {/* Top Header Image */}
      <div className="relative w-full max-w-sm">
        <Image
          src="/welcome-bg.png"
          alt="Vornduty Header"
          width={500}
          height={300}
          priority
          className="w-full h-auto object-cover rounded-b-3xl shadow-lg mb-0"
        />
      </div>

      <motion.div
        className="flex flex-col items-center text-center px-6 mt-0 space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="-mt-30 text-4xl sm:text-5xl font-extrabold bg-linear-to-r from-[#ff5c5c] to-[#ffb347] bg-clip-text text-transparent leading-tight drop-shadow-md">
          Welcome to<br />Vornduty Points Store
        </h1>

        <p className="max-w-xs text-zinc-300 text-base leading-relaxed">
          Buy game points instantly, securely, and at unbeatable prices.
          <br />
          Power up your Vornduty experience with just a few taps!
        </p>

        <div className="flex flex-col gap-4 mt-4 w-full max-w-60">
          <button
            onClick={() => router.push("/sign-in")}
            className="w-full py-3 bg-linear-to-r from-[#ff5c5c] to-[#ff7a3d] text-lg font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            Get Started
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3 border border-zinc-600 hover:border-zinc-400 text-lg font-semibold rounded-full text-zinc-300 transition-all hover:bg-zinc-800/40"
          >
            Learn More
          </button>
        </div>

        <footer className="w-full mt-auto border-t border-gradient-to-r from-[#ff5c5c] to-[#ffb347] pt-4 pb-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} Vornduty • All Rights Reserved
        </footer>

      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 px-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-[#1e1e2d] p-8 rounded-2xl shadow-2xl max-w-xs w-full text-center border border-zinc-700">
                <h2 className="text-xl font-bold mb-3 text-[#ffb347]">
                  Easy. Fast. Affordable.
                </h2>
                <p className="text-zinc-300 mb-6 text-sm leading-relaxed">
                  Welcome to the <span className="font-semibold text-white">Vornduty Points Store</span> — 
                  your go-to place to buy points easily, securely, and at the best prices.  
                  Enjoy smooth payments powered by Paystack!
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-linear-to-r from-[#ff5c5c] to-[#ff7a3d] rounded-full font-semibold text-white shadow-md hover:shadow-lg"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
