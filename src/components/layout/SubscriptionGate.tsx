"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, ArrowRight, Loader2 } from "lucide-react";

// Pages accessible on the Free tier (no subscription required)
const FREE_PAGES = [
  "/dashboard",
  "/settings",
  "/discover",
  "/leaderboard",
  "/agents",
];

type Tier = "free" | "paid";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "loaded">("loading");
  const [userTier, setUserTier] = useState<Tier>("free");

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((json) => {
        setUserTier((json.data?.tier as Tier) ?? "free");
        setStatus("loaded");
      })
      .catch(() => {
        setUserTier("free");
        setStatus("loaded");
      });
  }, []);

  // Free pages are always accessible
  if (FREE_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (userTier === "free") {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-violet-electric/10">
          <Crown className="size-8 text-violet-electric" />
        </div>
        <h2 className="mt-6 text-2xl font-bold">Pro Plan Required</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Deploy agents, sell on the marketplace, access analytics, and unlock
          everything AgentTV has to offer.
        </p>

        <SubscribeButton />

        <p className="mt-6 text-xs text-muted-foreground">
          $99/month &middot; Cancel anytime &middot; Bring your own LLM key
        </p>

        <Link
          href="/pricing"
          className="mt-3 inline-block text-sm text-violet-electric hover:underline"
        >
          View full plan details
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

function SubscribeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        setError(json.error?.message ?? "Something went wrong");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-electric px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-electric/90 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Go Pro — $99/mo
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
