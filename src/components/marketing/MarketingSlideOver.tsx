"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MarketingOverview } from "@/components/marketing/MarketingOverview"
import { PostGenerator } from "@/components/marketing/PostGenerator"
import { PostTray } from "@/components/marketing/PostTray"
import { BlogPostList } from "@/components/marketing/BlogPostList"
import { EmailSequences } from "@/components/marketing/EmailSequences"
import { ReferralDashboard } from "@/components/marketing/ReferralDashboard"

interface MarketingSlideOverProps {
  businessId: string
  businessName: string
}

type TabKey = "overview" | "social" | "blog" | "email" | "referrals" | "seo"

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "social", label: "Social Posts" },
  { key: "blog", label: "Blog" },
  { key: "email", label: "Email" },
  { key: "referrals", label: "Referrals" },
  { key: "seo", label: "SEO" },
]

const MarketingSlideOver = ({
  businessId,
  businessName,
}: MarketingSlideOverProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <MarketingOverview
            businessId={businessId}
            onNavigate={(tab) => setActiveTab(tab as TabKey)}
          />
        )

      case "social":
        return (
          <div className="space-y-6">
            <PostGenerator businessId={businessId} />
            <div className="border-t pt-6">
              <PostTray businessId={businessId} />
            </div>
          </div>
        )

      case "blog":
        return (
          <BlogPostList
            businessId={businessId}
            businessName={businessName}
          />
        )

      case "email":
        return <EmailSequences businessId={businessId} />

      case "referrals":
        return <ReferralDashboard businessId={businessId} />

      case "seo":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border p-6">
              <h4 className="text-lg font-semibold">Schema Markup</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Structured data helps search engines understand your content
                better. Generate JSON-LD schema markup for your knowledge
                products, courses, and business profile to improve visibility in
                search results.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 block size-1.5 shrink-0 rounded-full bg-primary" />
                  Organization and LocalBusiness schema
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 block size-1.5 shrink-0 rounded-full bg-primary" />
                  Course and Product structured data
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 block size-1.5 shrink-0 rounded-full bg-primary" />
                  FAQ and HowTo schema for content pages
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 block size-1.5 shrink-0 rounded-full bg-primary" />
                  Breadcrumb and SiteNavigationElement markup
                </li>
              </ul>
              <Button className="mt-6">Generate Schema</Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Marketing for {businessName}</h3>

      {/* Tab bar */}
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-1 border-b">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "shrink-0 cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>{renderTabContent()}</div>
    </div>
  )
}

export { MarketingSlideOver }
export type { MarketingSlideOverProps }
