"use client"

import { cn } from "@/lib/utils"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

const ChatMessage = ({ role, content, isStreaming = false }: ChatMessageProps) => {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "px-4 py-2 max-w-[80%] whitespace-pre-wrap",
          isUser
            ? "bg-[#0891b2] text-white rounded-2xl rounded-br-sm"
            : "bg-muted rounded-2xl rounded-bl-sm"
        )}
      >
        {content}
        {isStreaming && (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[#0891b2] align-middle" />
        )}
      </div>
    </div>
  )
}

export { ChatMessage }
export type { ChatMessageProps }
