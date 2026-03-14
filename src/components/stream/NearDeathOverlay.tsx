"use client";

import { motion, AnimatePresence } from "framer-motion";

interface NearDeathOverlayProps {
  isNearDeath: boolean;
}

export function NearDeathOverlay({ isNearDeath }: NearDeathOverlayProps) {
  return (
    <AnimatePresence>
      {isNearDeath && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none fixed inset-0 z-50"
          style={{
            boxShadow: "inset 0 0 80px rgba(255, 77, 109, 0.3)",
            border: "2px solid #FF4D6D",
          }}
        >
          {/* Pulsing corner warnings */}
          <motion.div
            className="absolute left-3 top-3 rounded-full bg-coral-neon/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-coral-neon"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            LOW BUDGET
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
