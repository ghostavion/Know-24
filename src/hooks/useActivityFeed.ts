"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import type { ActivityEvent } from "@/types/operations"

// Client-side Supabase for Realtime only
// Uses public anon key (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)

interface UseActivityFeedOptions {
  businessId: string
  limit?: number
}

interface UseActivityFeedReturn {
  events: ActivityEvent[]
  loading: boolean
  error: string | null
}

export function useActivityFeed({ businessId, limit = 20 }: UseActivityFeedOptions): UseActivityFeedReturn {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial events via API
  const fetchEvents = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const res = await fetch(`/api/analytics/activity?businessId=${businessId}&limit=${limit}`)
      const json: { data?: ActivityEvent[]; error?: { message: string } } = await res.json()
      if (json.data) {
        setEvents(json.data)
      } else if (json.error) {
        setError(json.error.message)
      }
    } catch {
      setError("Failed to load activity feed")
    } finally {
      setLoading(false)
    }
  }, [businessId, limit])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Subscribe to real-time inserts on activity_log
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return

    const client = createClient(supabaseUrl, supabaseKey)

    const channel = client
      .channel(`activity_log_${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_log",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const newEvent: ActivityEvent = {
            id: row.id as string,
            businessId: row.business_id as string,
            eventType: row.event_type as string,
            title: row.title as string,
            description: (row.description as string) ?? null,
            metadata: (row.metadata as Record<string, unknown>) ?? {},
            createdAt: row.created_at as string,
          }
          setEvents((prev) => [newEvent, ...prev].slice(0, limit))
        }
      )
      .subscribe()

    return (): void => {
      client.removeChannel(channel)
    }
  }, [businessId, limit])

  return { events, loading, error }
}
