"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Copy,
  Check,
  Link2,
  MousePointerClick,
  Users,
  Trophy,
  Share2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type RewardTier = "none" | "free_month" | "rev_share_20" | "rev_share_30";

interface ReferralConversion {
  id: string;
  referred_user_id: string;
  status: string;
  reward_granted: string | null;
  created_at: string;
}

interface ReferralStats {
  link: { code: string; url: string } | null;
  stats: {
    totalClicks: number;
    totalConversions: number;
    currentTier: RewardTier;
    nextTier: RewardTier | null;
    conversionsToNextTier: number;
  };
  recentConversions: ReferralConversion[];
}

const TIER_LABELS: Record<RewardTier, string> = {
  none: "Free",
  free_month: "Free Month",
  rev_share_20: "20% Revenue Share",
  rev_share_30: "30% Revenue Share",
};

const TIER_THRESHOLDS: { tier: RewardTier; count: number }[] = [
  { tier: "none", count: 0 },
  { tier: "free_month", count: 3 },
  { tier: "rev_share_20", count: 10 },
  { tier: "rev_share_30", count: 25 },
];

export function ReferralDashboard() {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/referrals/stats");
      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
        return;
      }
      setData(json.data);
    } catch {
      setError("Failed to load referral stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const ensureLink = async () => {
    if (data?.link) return data.link;
    setCreatingLink(true);
    try {
      const res = await fetch("/api/referrals/link");
      const json = await res.json();
      if (json.data) {
        await fetchStats();
        return json.data as { code: string; url: string };
      }
    } finally {
      setCreatingLink(false);
    }
    return null;
  };

  const copyLink = async () => {
    const link = await ensureLink();
    if (!link) return;
    await navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = async () => {
    const link = await ensureLink();
    if (!link) return;
    const text = encodeURIComponent(
      `I've been using AgentTV to power my business with AI. Check it out: ${link.url}`
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareLinkedIn = async () => {
    const link = await ensureLink();
    if (!link) return;
    const url = encodeURIComponent(link.url);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentConversions } = data;

  // Progress bar calculations
  const currentTierIndex = TIER_THRESHOLDS.findIndex(
    (t) => t.tier === stats.currentTier
  );
  const nextTierInfo = stats.nextTier
    ? TIER_THRESHOLDS.find((t) => t.tier === stats.nextTier)
    : null;
  const currentThreshold =
    TIER_THRESHOLDS[currentTierIndex]?.count ?? 0;
  const nextThreshold = nextTierInfo?.count ?? currentThreshold;
  const progressInTier = stats.totalConversions - currentThreshold;
  const tierSpan = nextThreshold - currentThreshold;
  const progressPercent =
    tierSpan > 0 ? Math.min((progressInTier / tierSpan) * 100, 100) : 100;

  return (
    <div className="space-y-6">
      {/* Referral Link */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="size-5 text-[#7C3AED]" />
          <h3 className="text-lg font-semibold text-gray-900">
            Your Referral Link
          </h3>
        </div>
        {data.link ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono text-gray-700 truncate">
              {data.link.url}
            </div>
            <Button variant="outline" size="default" onClick={copyLink}>
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : (
          <Button onClick={copyLink} disabled={creatingLink}>
            {creatingLink ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Link2 className="size-4" />
            )}
            Generate Referral Link
          </Button>
        )}

        {/* Share buttons */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">Share:</span>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="size-3.5" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={shareTwitter}>
            <Share2 className="size-3.5" />
            X / Twitter
          </Button>
          <Button variant="outline" size="sm" onClick={shareLinkedIn}>
            <Share2 className="size-3.5" />
            LinkedIn
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<MousePointerClick className="size-5 text-[#7C3AED]" />}
          label="Total Clicks"
          value={stats.totalClicks}
        />
        <StatCard
          icon={<Users className="size-5 text-[#7C3AED]" />}
          label="Total Conversions"
          value={stats.totalConversions}
        />
        <StatCard
          icon={<Trophy className="size-5 text-[#7C3AED]" />}
          label="Current Tier"
          value={TIER_LABELS[stats.currentTier]}
        />
      </div>

      {/* Progress to Next Tier */}
      {stats.nextTier && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Progress to {TIER_LABELS[stats.nextTier]}
          </h3>
          <div className="relative h-3 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#7C3AED] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {stats.totalConversions} of {nextThreshold} referrals
            <span className="ml-1 text-gray-400">
              ({stats.conversionsToNextTier} more needed)
            </span>
          </p>
        </div>
      )}

      {/* Tier Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Reward Tiers
        </h3>
        <div className="space-y-3">
          {TIER_THRESHOLDS.map(({ tier, count }) => {
            const isActive = stats.currentTier === tier;
            const isAchieved =
              TIER_THRESHOLDS.findIndex((t) => t.tier === tier) <=
              currentTierIndex;
            return (
              <div
                key={tier}
                className={cn(
                  "flex items-center justify-between rounded-lg px-4 py-3 text-sm",
                  isActive
                    ? "border-2 border-[#7C3AED] bg-[#7C3AED]/5 font-medium text-gray-900"
                    : isAchieved
                      ? "border border-green-200 bg-green-50 text-gray-700"
                      : "border border-gray-100 bg-gray-50 text-gray-500"
                )}
              >
                <span>{TIER_LABELS[tier]}</span>
                <span>
                  {count === 0 ? "Start" : `${count} referrals`}
                  {isActive && " (current)"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Conversions */}
      {recentConversions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Recent Conversions
          </h3>
          <div className="space-y-2">
            {recentConversions.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#7C3AED]/10">
                    <Users className="size-4 text-[#7C3AED]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      New referral signup
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(conv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    conv.status === "subscribed"
                      ? "bg-green-100 text-green-700"
                      : conv.status === "signed_up"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                  )}
                >
                  {conv.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
