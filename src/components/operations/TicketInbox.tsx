"use client"

import { useEffect, useState, useCallback } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type {
  SupportTicket,
  TicketReply,
  TicketStatus,
} from "@/types/operations"

interface TicketWithReplies extends SupportTicket {
  replies: TicketReply[]
}

interface TicketInboxProps {
  businessId: string
}

const STATUS_BADGE_CLASSES: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
}

const timeAgo = (dateStr: string): string => {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

const SkeletonRows = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="animate-pulse space-y-2 rounded-lg border p-4">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    ))}
  </div>
)

const TicketInbox = ({ businessId }: TicketInboxProps) => {
  const [tickets, setTickets] = useState<TicketWithReplies[]>([])
  const [selectedTicket, setSelectedTicket] = useState<TicketWithReplies | null>(null)
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<"all" | TicketStatus>("all")

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/support/tickets?businessId=${businessId}`)
      const json: { data?: TicketWithReplies[] } = await res.json()
      if (json.data) {
        setTickets(json.data)
      }
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    const res = await fetch(`/api/support/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      )
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    }
  }

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: { body: replyText.trim() } }),
      })
      if (res.ok) {
        const json: { data?: TicketWithReplies } = await res.json()
        if (json.data) {
          setSelectedTicket(json.data)
          setTickets((prev) =>
            prev.map((t) => (t.id === json.data!.id ? json.data! : t))
          )
        }
        setReplyText("")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTickets =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter)

  if (loading) {
    return <SkeletonRows />
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No support tickets</p>
      </div>
    )
  }

  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
          &larr; Back to inbox
        </Button>

        <div className="space-y-2">
          <h4 className="text-lg font-semibold">{selectedTicket.subject}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{selectedTicket.customerEmail}</span>
            <span>&middot;</span>
            <span>{timeAgo(selectedTicket.createdAt)}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_BADGE_CLASSES[selectedTicket.status]
              )}
            >
              {STATUS_LABELS[selectedTicket.status]}
            </span>
          </div>
        </div>

        <div className="rounded-lg border p-4 text-sm">{selectedTicket.body}</div>

        {/* Replies thread */}
        {selectedTicket.replies.length > 0 && (
          <div className="space-y-3 border-l-2 border-muted pl-4">
            {selectedTicket.replies.map((reply) => (
              <div key={reply.id} className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{reply.senderName ?? reply.senderType}</span>
                  <span>{timeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-sm">{reply.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status actions */}
        <div className="flex flex-wrap gap-2">
          {selectedTicket.status !== "in_progress" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(selectedTicket.id, "in_progress")}
            >
              Mark as In Progress
            </Button>
          )}
          {selectedTicket.status !== "resolved" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(selectedTicket.id, "resolved")}
            >
              Resolve
            </Button>
          )}
          {selectedTicket.status !== "closed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(selectedTicket.id, "closed")}
            >
              Close
            </Button>
          )}
        </div>

        {/* Reply form */}
        <div className="space-y-2 border-t pt-4">
          <textarea
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <Button size="sm" disabled={!replyText.trim() || submitting} onClick={handleReply}>
            {submitting ? "Sending..." : "Send Reply"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-1">
        {(["all", "open", "in_progress", "resolved", "closed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="space-y-2">
        {filteredTickets.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            onClick={() => setSelectedTicket(ticket)}
            className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{ticket.subject}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {ticket.customerEmail}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    STATUS_BADGE_CLASSES[ticket.status]
                  )}
                >
                  {STATUS_LABELS[ticket.status]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {timeAgo(ticket.createdAt)}
                </span>
              </div>
            </div>
          </button>
        ))}
        {filteredTickets.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tickets match this filter
          </p>
        )}
      </div>
    </div>
  )
}

export { TicketInbox }
export type { TicketInboxProps }
