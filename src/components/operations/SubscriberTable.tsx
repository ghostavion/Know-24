"use client"

import { useEffect, useState, useCallback } from "react"

import { Button } from "@/components/ui/button"
import type { SubscriberRecord } from "@/types/operations"

interface SubscriberTableProps {
  businessId: string
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const SkeletonTable = () => (
  <div className="space-y-3">
    <div className="h-8 w-full animate-pulse rounded bg-muted" />
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
    ))}
  </div>
)

const SubscriberTable = ({ businessId }: SubscriberTableProps) => {
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [exporting, setExporting] = useState(false)

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/subscribers?businessId=${businessId}`)
      const json: { data?: SubscriberRecord[] } = await res.json()
      if (json.data) {
        setSubscribers(json.data)
      }
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const res = await fetch(
        `/api/subscribers?businessId=${businessId}&format=csv`
      )
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "subscribers.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const filteredSubscribers = searchQuery
    ? subscribers.filter((s) =>
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : subscribers

  if (loading) {
    return <SkeletonTable />
  }

  if (subscribers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No subscribers yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search by email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button variant="outline" size="sm" disabled={exporting} onClick={handleExportCsv}>
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filteredSubscribers.length} of {subscribers.length} subscriber
        {subscribers.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Source
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Subscribed Date
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map((sub) => (
              <tr key={sub.id} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">{sub.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {sub.name ?? "--"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {sub.source ?? "direct"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(sub.subscribedAt)}
                </td>
              </tr>
            ))}
            {filteredSubscribers.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No subscribers match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { SubscriberTable }
export type { SubscriberTableProps }
