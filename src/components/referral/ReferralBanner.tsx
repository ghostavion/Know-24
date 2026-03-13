"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, Gift, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "know24_referral_banner_dismissed";

export function ReferralBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISS_KEY) === "true";
    setDismissed(wasDismissed);
  }, []);

  const fetchLink = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referrals/link");
      const json = await res.json();
      if (json.data?.url) {
        setReferralUrl(json.data.url);
      }
    } catch {
      // Silently fail — banner is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!dismissed) {
      fetchLink();
    }
  }, [dismissed, fetchLink]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (dismissed) return null;

  return (
    <div className="relative flex items-center gap-4 rounded-xl border border-[#0891b2]/20 bg-[#0891b2]/5 px-5 py-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0891b2]/10">
        <Gift className="size-5 text-[#0891b2]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">
          Share Know24, earn rewards
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Refer 3 users for a free month, 10 for 20% revenue share, 25 for 30%
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {loading ? (
          <Loader2 className="size-4 animate-spin text-[#0891b2]" />
        ) : referralUrl ? (
          <>
            <span className="hidden sm:block max-w-[200px] truncate rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono text-gray-600">
              {referralUrl}
            </span>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="size-3.5 text-green-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </>
        ) : null}
      </div>

      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
