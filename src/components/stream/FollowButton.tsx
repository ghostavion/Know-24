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
    try {
      // TODO: Wire to /api/agents/[slug]/follow
      await new Promise((r) => setTimeout(r, 300));
      setFollowing(!following);
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
