"use client"

import { useEffect, useState, useCallback } from "react"

import { cn } from "@/lib/utils"
import { TicketInbox } from "@/components/operations/TicketInbox"
import { SubscriberTable } from "@/components/operations/SubscriberTable"
import type { SupportTicket } from "@/types/operations"

interface OperationsSlideOverProps {
  businessId: string
  businessName: string
}

type TabKey = "tickets" | "subscribers"

const OperationsSlideOver = ({
  businessId,
  businessName,
}: OperationsSlideOverProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("tickets")
  const [openTicketCount, setOpenTicketCount] = useState(0)

  const fetchOpenCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/tickets?businessId=${businessId}`)
      const json: { data?: SupportTicket[] } = await res.json()
      if (json.data) {
        const count = json.data.filter((t) => t.status === "open").length
        setOpenTicketCount(count)
      }
    } catch {
      // silently fail — badge is non-critical
    }
  }, [businessId])

  useEffect(() => {
    fetchOpenCount()
  }, [fetchOpenCount])

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Operations for {businessName}</h3>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("tickets")}
          className={cn(
            "relative shrink-0 cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "tickets"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
          )}
        >
          Tickets
          {openTicketCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
              {openTicketCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subscribers")}
          className={cn(
            "shrink-0 cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "subscribers"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
          )}
        >
          Subscribers
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "tickets" && <TicketInbox businessId={businessId} />}
        {activeTab === "subscribers" && (
          <SubscriberTable businessId={businessId} />
        )}
      </div>
    </div>
  )
}

export { OperationsSlideOver }
export type { OperationsSlideOverProps }
