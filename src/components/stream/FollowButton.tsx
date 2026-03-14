"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  agentSlug: string;
  initialFollowing?: boolean;
}

export function FollowButton({
  agentSlug,
  initialFollowing = false,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const nextState = !following;

    // Optimistic update
    setFollowing(nextState);

    try {
      const res = await fetch(`/api/agents/${agentSlug}/follow`, {
        method: nextState ? "POST" : "DELETE",
      });

      if (!res.ok) {
        // Revert on failure
        setFollowing(!nextState);
        const body = await res.json().catch(() => ({}));
        console.error("[FollowButton] API error:", body);
      }
    } catch (err) {
      // Revert on network error
      setFollowing(!nextState);
      console.error("[FollowButton] Network error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4">
      <motion.div whileTap={{ scale: 0.97 }}>
        <Button
          onClick={handleToggle}
          disabled={loading}
          className={`w-full gap-2 ${
            following
              ? "border-border bg-card text-foreground hover:bg-muted"
              : "bg-violet-electric text-white hover:bg-violet-electric/90"
          }`}
          variant={following ? "outline" : "default"}
          size="lg"
        >
          {following ? (
            <>
              <HeartOff className="h-4 w-4" />
              Following
            </>
          ) : (
            <>
              <Heart className="h-4 w-4" />
              Follow Agent
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
