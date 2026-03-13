"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, ArrowRight, Loader2 } from "lucide-react";
import { FOUNDER_PRICE, STANDARD_PRICE, FOUNDER_SLOTS_TOTAL } from "@/data/pricing";

// Pages that don't require an active subscription
const FREE_PAGES = ["/dashboard", "/settings", "/credits", "/referrals"];

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "active" | "inactive">("loading");

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((json) => {
        setStatus(json.data?.active ? "active" : "inactive");
      })
      .catch(() => setStatus("inactive"));
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

  if (status === "inactive") {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Crown className="size-8 text-primary" />
        </div>
        <h2 className="mt-6 text-2xl font-bold">Subscribe to Access</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          You need an active subscription to use research, ebook generation,
          scout, and publishing. Choose a plan to get started.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <SubscribeCard
            name="Founder"
            price={FOUNDER_PRICE}
            badge="Limited Spots"
            plan="founder"
            highlighted
          />
          <SubscribeCard
            name="Standard"
            price={STANDARD_PRICE}
            plan="standard"
          />
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          First {FOUNDER_SLOTS_TOTAL} members lock in founder pricing forever.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

function SubscribeCard({
  name,
  price,
  badge,
  plan,
  highlighted,
}: {
  name: string;
  price: number;
  badge?: string;
  plan: string;
  highlighted?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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
    <div
      className={`rounded-xl border p-6 text-left ${
        highlighted ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
    >
      {badge && (
        <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {badge}
        </span>
      )}
      <p className="text-lg font-bold">{name}</p>
      <p className="mt-1">
        <span className="text-2xl font-bold">${price}</span>
        <span className="text-sm text-muted-foreground">/mo</span>
      </p>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
          highlighted
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border border-border hover:bg-muted"
        } disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Get Started
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
