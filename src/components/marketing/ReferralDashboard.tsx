"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Plus, Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ReferralDashboardProps {
  businessId: string
}

interface ReferralLink {
  id: string
  code: string
  clicks: number
  signups: number
  purchases: number
  commission_rate: number
  is_active: boolean
  created_at: string
}

const SkeletonCard = () => (
  <div className="animate-pulse rounded-lg border p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-3 w-48 rounded bg-muted" />
      </div>
      <div className="h-8 w-16 rounded bg-muted" />
    </div>
  </div>
)

const ReferralDashboard = ({ businessId }: ReferralDashboardProps) => {
  const [links, setLinks] = useState<ReferralLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [commissionRate, setCommissionRate] = useState("10")

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/referrals?businessId=${businessId}`)
      if (res.ok) {
        const data: { links?: ReferralLink[] } = await res.json()
        setLinks(data.links ?? [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  const handleCreate = async () => {
    const rate = parseFloat(commissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) return

    setCreating(true)
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          commissionRate: rate / 100,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setCommissionRate("10")
        await fetchLinks()
      }
    } catch {
      // Silently fail
    } finally {
      setCreating(false)
    }
  }

  const handleCopyLink = async (link: ReferralLink) => {
    const url = `${window.location.origin}/ref/${link.code}`
    await navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Aggregate stats
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0)
  const totalSignups = links.reduce((sum, l) => sum + l.signups, 0)
  const totalPurchases = links.reduce((sum, l) => sum + l.purchases, 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border p-4">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="mt-2 h-6 w-10 rounded bg-muted" />
            </div>
          ))}
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Clicks
          </div>
          <div className="mt-1 text-2xl font-bold">{totalClicks}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Signups
          </div>
          <div className="mt-1 text-2xl font-bold">{totalSignups}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Purchases
          </div>
          <div className="mt-1 text-2xl font-bold">{totalPurchases}</div>
        </div>
      </div>

      {/* Create form */}
      {showForm ? (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <h4 className="text-sm font-semibold">Create Referral Link</h4>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={creating}
            >
              {creating && <Loader2 className="size-3.5 animate-spin" />}
              Create Link
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              disabled={creating}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-3.5" />
          Create Referral Link
        </Button>
      )}

      {/* Empty state */}
      {links.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No referral links yet. Create one to start earning through
            word-of-mouth.
          </p>
        </div>
      )}

      {/* Link list */}
      {links.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Referral Links
          </h4>
          {links.map((link) => (
            <div
              key={link.id}
              className="rounded-lg border p-4 transition hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono">
                      {link.code}
                    </code>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        link.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                      )}
                    >
                      {link.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>
                      Clicks: <strong className="text-foreground">{link.clicks}</strong>
                    </span>
                    <span>
                      Signups: <strong className="text-foreground">{link.signups}</strong>
                    </span>
                    <span>
                      Purchases:{" "}
                      <strong className="text-foreground">{link.purchases}</strong>
                    </span>
                    <span>
                      Commission:{" "}
                      <strong className="text-foreground">
                        {(link.commission_rate * 100).toFixed(0)}%
                      </strong>
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(link)}
                >
                  {copiedId === link.id ? (
                    <>
                      <Check className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { ReferralDashboard }
export type { ReferralDashboardProps }
