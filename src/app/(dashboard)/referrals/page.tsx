"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Copy, Check, Gift, Crown, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  isFounder: boolean;
  tier: string;
  stats: {
    totalReferrals: number;
    pendingCount: number;
    signedUpCount: number;
    convertedCount: number;
    rewardedCount: number;
  };
  referrals: Array<{
    id: string;
    status: string;
    reward_type: string | null;
    created_at: string;
    signed_up_at: string | null;
    converted_at: string | null;
  }>;
}

interface ProfileData {
  profile: {
    subscription_tier: string;
    founding_member: boolean;
    monthly_price_cents: number;
    subscription_status: string;
  };
  credits: {
    balance: number;
    monthlyAllocation: number;
    resetDate: string;
  };
  founderSlotsRemaining: number;
  pricing: {
    founder: number;
    standard: number;
  };
}

export default function ReferralsPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [refRes, profRes] = await Promise.all([
        fetch("/api/referrals/v1"),
        fetch("/api/profile"),
      ]);
      const [refJson, profJson] = await Promise.all([refRes.json(), profRes.json()]);
      if (refJson.data) setReferralData(refJson.data);
      if (profJson.data) setProfileData(profJson.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyLink = () => {
    if (!referralData) return;
    navigator.clipboard.writeText(referralData.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-40 rounded-xl bg-muted" />
          <div className="h-32 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referrals & Account</h1>
        <p className="mt-1 text-muted-foreground">
          Invite friends and both of you get 50 bonus credits.
        </p>
      </div>

      {/* Founder Badge */}
      {profileData?.profile.founding_member && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-yellow-500/30 bg-yellow-500/5 p-4">
          <Crown className="size-6 text-yellow-600" />
          <div>
            <p className="font-semibold text-yellow-700 dark:text-yellow-400">Founding Member</p>
            <p className="text-sm text-muted-foreground">
              Locked in at ${(profileData.pricing.founder / 100).toFixed(0)}/mo forever
              (saves ${((profileData.pricing.standard - profileData.pricing.founder) / 100).toFixed(0)}/mo)
            </p>
          </div>
        </div>
      )}

      {/* Founder slots CTA */}
      {profileData && !profileData.profile.founding_member && profileData.founderSlotsRemaining > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <Crown className="size-5 text-yellow-600" />
            <div>
              <p className="font-semibold">
                {profileData.founderSlotsRemaining} Founder Slots Remaining
              </p>
              <p className="text-sm text-muted-foreground">
                Subscribe now to lock in $79/mo forever (regular price: $99/mo)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Referral Link */}
      {referralData && (
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Gift className="size-5 text-primary" />
            <h2 className="font-semibold">Your Referral Link</h2>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralData.referralUrl}
              className="flex-1 rounded-lg border bg-muted px-4 py-2.5 text-sm"
            />
            <Button onClick={copyLink} variant="outline">
              {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Code: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{referralData.referralCode}</code>
          </p>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold">{referralData.stats.totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold">{referralData.stats.pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold">{referralData.stats.signedUpCount}</p>
              <p className="text-xs text-muted-foreground">Signed Up</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{referralData.stats.rewardedCount}</p>
              <p className="text-xs text-muted-foreground">Rewarded</p>
            </div>
          </div>
        </div>
      )}

      {/* Referral History */}
      {referralData && referralData.referrals.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Referral History
          </h2>
          <div className="space-y-3">
            {referralData.referrals.map((ref) => {
              const statusColors: Record<string, string> = {
                pending: "bg-gray-500",
                clicked: "bg-yellow-500",
                signed_up: "bg-blue-500",
                converted: "bg-green-500",
                rewarded: "bg-green-500",
              };
              return (
                <div key={ref.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Users className="size-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", statusColors[ref.status] ?? "bg-gray-500")} />
                        <span className="text-sm font-medium capitalize">{ref.status.replace("_", " ")}</span>
                      </div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {new Date(ref.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {ref.reward_type && (
                    <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
                      +50 credits
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
