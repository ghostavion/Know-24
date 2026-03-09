"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MarketingOverviewProps {
  businessId: string
  onNavigate?: (tab: string) => void
}

interface OverviewStats {
  socialPosts: number | null
  blogPosts: number | null
  emailsSent: number | null
  referralClicks: number | null
}

const StatCard = ({
  label,
  value,
  iconLabel,
  loading,
}: {
  label: string
  value: number | null
  iconLabel: string
  loading: boolean
}) => (
  <div className="rounded-lg border p-4 transition hover:bg-muted/50">
    <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {iconLabel}
    </div>
    <div className="text-3xl font-bold">
      {loading ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : value !== null ? (
        value
      ) : (
        <span className="text-muted-foreground">&mdash;</span>
      )}
    </div>
    <div className="mt-1 text-sm text-muted-foreground">{label}</div>
  </div>
)

const MarketingOverview = ({ businessId, onNavigate }: MarketingOverviewProps) => {
  const [stats, setStats] = useState<OverviewStats>({
    socialPosts: null,
    blogPosts: null,
    emailsSent: null,
    referralClicks: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/marketing/posts?businessId=${businessId}`)
        if (res.ok) {
          const data: { posts?: unknown[] } = await res.json()
          const posts = data.posts ?? []
          setStats({
            socialPosts: posts.length,
            blogPosts: 0,
            emailsSent: 0,
            referralClicks: 0,
          })
        }
      } catch {
        // Stats remain null on error
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [businessId])

  const quickActions = [
    { label: "Generate Post", tab: "social" },
    { label: "Write Blog", tab: "blog" },
    { label: "Setup Email Sequence", tab: "email" },
    { label: "Create Referral Link", tab: "referrals" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          iconLabel="Social Posts"
          label="Total Posts"
          value={stats.socialPosts}
          loading={loading}
        />
        <StatCard
          iconLabel="Blog Posts"
          label="Blog Posts"
          value={stats.blogPosts}
          loading={loading}
        />
        <StatCard
          iconLabel="Emails Sent"
          label="Emails Sent"
          value={stats.emailsSent}
          loading={loading}
        />
        <StatCard
          iconLabel="Referral Clicks"
          label="Referral Clicks"
          value={stats.referralClicks}
          loading={loading}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.tab}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate?.(action.tab)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {!loading && stats.socialPosts === null && (
        <p className={cn("text-center text-sm text-muted-foreground")}>
          Stats loading...
        </p>
      )}
    </div>
  )
}

export { MarketingOverview }
export type { MarketingOverviewProps }
