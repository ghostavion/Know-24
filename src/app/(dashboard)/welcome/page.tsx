"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Search,
  CreditCard,
  ArrowRight,
  Loader2,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FOUNDER_PRICE, STANDARD_PRICE } from "@/data/pricing";

type SubStatus = "loading" | "active" | "inactive";

export default function WelcomePage() {
  const router = useRouter();
  const [subStatus, setSubStatus] = useState<SubStatus>("loading");
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.active) {
          // Already subscribed — redirect to dashboard
          router.replace("/dashboard");
        } else {
          setSubStatus("inactive");
        }
      })
      .catch(() => setSubStatus("inactive"));
  }, [router]);

  const handleSubscribe = async (plan: string) => {
    setSubscribing(plan);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      }
    } finally {
      setSubscribing(null);
    }
  };

  if (subStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-12">
      {/* Welcome header */}
      <div className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="size-8 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-bold">Welcome to Know24</h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Create AI-powered ebooks from research in minutes. Subscribe to get
          started with 200 monthly credits.
        </p>
      </div>

      {/* How it works */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Search,
            title: "1. Research",
            desc: "AI scans the market and builds a Proof Card for your niche",
          },
          {
            icon: BookOpen,
            title: "2. Generate",
            desc: "Full ebook with chapters, polish pass, and cover art",
          },
          {
            icon: CreditCard,
            title: "3. Sell",
            desc: "Publish to your storefront and start earning",
          },
        ].map((step) => (
          <div
            key={step.title}
            className="rounded-xl border border-border bg-card p-5 text-center"
          >
            <step.icon className="mx-auto size-6 text-primary" />
            <p className="mt-3 text-sm font-semibold">{step.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Subscription plans */}
      <h2 className="mt-12 text-center text-xl font-bold">Choose Your Plan</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Founder */}
        <div className="rounded-xl border-2 border-primary bg-card p-6">
          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Limited Spots
          </span>
          <p className="mt-3 text-lg font-bold">Founder</p>
          <p className="mt-1">
            <span className="text-3xl font-bold">${FOUNDER_PRICE}</span>
            <span className="text-sm text-muted-foreground">/mo forever</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {[
              "200 AI credits/month",
              "Full ebook pipeline",
              "Cover art generation",
              "Scout scanning",
              "Priority support",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="size-4 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscribe("founder")}
            disabled={subscribing !== null}
            className={cn(
              "mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3",
              "text-sm font-semibold text-primary-foreground",
              "hover:bg-primary/90 disabled:opacity-50 transition-colors"
            )}
          >
            {subscribing === "founder" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Claim Founder Spot
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>

        {/* Standard */}
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="mt-3 text-lg font-bold">Standard</p>
          <p className="mt-1">
            <span className="text-3xl font-bold">${STANDARD_PRICE}</span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {[
              "200 AI credits/month",
              "Full ebook pipeline",
              "Cover art generation",
              "Scout scanning",
              "Email support",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="size-4 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscribe("standard")}
            disabled={subscribing !== null}
            className={cn(
              "mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3",
              "text-sm font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
            )}
          >
            {subscribing === "standard" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Get Started
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already subscribed?{" "}
        <Link href="/dashboard" className="text-primary hover:underline">
          Go to Dashboard
        </Link>
      </p>
    </div>
  );
}
