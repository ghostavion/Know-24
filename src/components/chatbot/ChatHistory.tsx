"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, MessageSquare, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ChatHistoryProps {
  businessId: string
  productId: string
  customerEmail: string
  onSelectConversation: (conversationId: string) => void
  activeConversationId: string | null
}

interface ConversationSummary {
  id: string
  title: string | null
  lastMessageAt: string
  messageCount: number
}

const formatRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (diffDays === 1) {
    return "Yesterday"
  }

  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" })
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

const SkeletonItem = () => (
  <div className="animate-pulse space-y-2 rounded-lg border border-border p-3">
    <div className="h-4 w-3/4 rounded bg-muted" />
    <div className="h-3 w-1/2 rounded bg-muted" />
  </div>
)

const ChatHistory = ({
  businessId,
  productId,
  customerEmail,
  onSelectConversation,
  activeConversationId,
}: ChatHistoryProps) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        productId,
        customerEmail,
      })

      const res = await fetch(
        `/api/chat/${businessId}/conversations?${params.toString()}`
      )

      if (!res.ok) {
        throw new Error("Failed to load conversations")
      }

      const json: { data?: ConversationSummary[]; error?: { message: string } } =
        await res.json()

      if (json.data) {
        setConversations(json.data)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load conversations"
      )
    } finally {
      setLoading(false)
    }
  }, [businessId, productId, customerEmail])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const handleNewConversation = () => {
    onSelectConversation("")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          Conversations
        </h3>
      </div>

      {/* New conversation button */}
      <div className="border-b px-3 py-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleNewConversation}
        >
          <Plus className="size-3.5" />
          New conversation
        </Button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-2">
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchConversations}>
              Retry
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageSquare className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No previous conversations
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "w-full cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  )}
                >
                  <p
                    className={cn(
                      "truncate text-sm",
                      isActive
                        ? "font-semibold text-foreground"
                        : "font-medium text-foreground"
                    )}
                  >
                    {conversation.title ?? "Untitled conversation"}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatRelativeDate(conversation.lastMessageAt)}</span>
                    <span className="size-0.5 rounded-full bg-muted-foreground/50" />
                    <span>
                      {conversation.messageCount}{" "}
                      {conversation.messageCount === 1 ? "message" : "messages"}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export { ChatHistory }
export type { ChatHistoryProps }
