"use client"

import {
  DollarSign,
  Package,
  FileText,
  Search,
  Mail,
  Users,
  Bell,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useActivityFeed } from "@/hooks/useActivityFeed"
import type { ActivityEvent } from "@/types/operations"

interface ActivityFeedProps {
  businessId: string
}

const EVENT_ICONS: Record<string, LucideIcon> = {
  sale: DollarSign,
  product_created: Package,
  blog_published: FileText,
  scout_scan_completed: Search,
  email_sent: Mail,
  subscriber_added: Users,
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

const SkeletonFeed = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex gap-3">
        <div className="size-8 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    ))}
  </div>
)

const ActivityFeed = ({ businessId }: ActivityFeedProps) => {
  const { events, loading } = useActivityFeed({ businessId })

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">Live</span>
        </div>
        <SkeletonFeed />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">Live</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No activity yet. Events will appear here as they happen.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-green-500" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">Live</span>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {events.map((event, i) => {
          const IconComponent = EVENT_ICONS[event.eventType] ?? Bell
          const isLast = i === events.length - 1

          return (
            <div key={event.id} className="relative flex gap-3 pb-4">
              {/* Vertical line */}
              {!isLast && (
                <div className="absolute left-4 top-8 h-full w-px bg-border" />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted"
                )}
              >
                <IconComponent className="size-4 text-muted-foreground" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium">{event.title}</p>
                {event.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {timeAgo(event.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ActivityFeed }
export type { ActivityFeedProps }
