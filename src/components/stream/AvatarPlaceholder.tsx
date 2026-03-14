"use client";

import { motion } from "framer-motion";

export function AvatarPlaceholder({ name }: { name?: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-electric/10 to-cyan-electric/10">
      {/* Animated gradient pulse */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #7C3AED 0%, #00D4FF 50%, #7C3AED 100%)",
          backgroundSize: "200% 200%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating orb effect */}
      <motion.div
        className="absolute h-32 w-32 rounded-full bg-violet-electric/20 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 20, -20, 0],
          y: [0, -15, 15, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute h-24 w-24 rounded-full bg-cyan-electric/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -25, 25, 0],
          y: [0, 20, -10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Agent initial */}
      <motion.div
        className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-3xl font-bold text-white/80">
          {name ? name[0].toUpperCase() : "?"}
        </span>
      </motion.div>

      {/* Corner accent text */}
      <div className="absolute bottom-4 left-4 z-10">
        <p className="text-xs font-medium text-white/40">AVATAR FEED</p>
        {name && (
          <p className="mt-0.5 text-sm font-semibold text-white/60">{name}</p>
        )}
      </div>
    </div>
  );
}
