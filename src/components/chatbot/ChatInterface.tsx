"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ChatInterfaceProps {
  businessId: string
  productId: string
  productTitle: string
  personality: string | null
  accentColor: string
}

type GateStatus = "idle" | "submitting"

const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
          <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
          <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
}

const ChatInterface = ({
  businessId,
  productId,
  productTitle,
  personality,
  accentColor,
}: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [gateStatus, setGateStatus] = useState<GateStatus>("idle")
  const [hasEmail, setHasEmail] = useState(false)
  const [inputText, setInputText] = useState("")

  const defaultGreeting = personality
    ? `Hi there! ${personality.toLowerCase().includes("casual") ? "What's on your mind?" : "How can I help you today?"}`
    : "Hi! How can I help you today?"

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chat/${businessId}`,
      body: {
        productId,
        customerEmail: email,
        customerName: name || undefined,
      },
    }),
  })

  const isStreaming = status === "streaming" || status === "submitted"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 96)}px`
    }
  }, [inputText])

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim()) return
    setGateStatus("submitting")
    setHasEmail(true)
    setGateStatus("idle")
  }

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inputText.trim() || isStreaming) return
    sendMessage({ text: inputText })
    setInputText("")
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!inputText.trim() || isStreaming) return
      sendMessage({ text: inputText })
      setInputText("")
    }
  }

  // Email gate
  if (!hasEmail) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">{productTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email to start chatting
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="chat-name"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Name{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="chat-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="chat-email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Email Address
              </label>
              <input
                id="chat-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={gateStatus === "submitting"}
              className={cn(
                "w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              style={{ backgroundColor: accentColor }}
            >
              Start Chatting
            </button>
          </form>
        </div>
      </div>
    )
  }

  const allMessages = messages.length === 0
    ? [{ id: "greeting", role: "assistant" as const, parts: [{ type: "text" as const, text: defaultGreeting }] }]
    : messages

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{productTitle}</h2>
        <p className="text-xs text-muted-foreground">AI-powered assistant</p>
      </div>

      {/* Messages list */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {allMessages.map((message) => {
          if (message.role !== "user" && message.role !== "assistant") {
            return null
          }

          const isUser = message.role === "user"
          const text = getMessageText(message)

          return (
            <div
              key={message.id}
              className={cn("flex", isUser ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2",
                  isUser
                    ? "rounded-br-sm text-white"
                    : "rounded-bl-sm bg-muted"
                )}
                style={isUser ? { backgroundColor: accentColor } : undefined}
              >
                {text}
              </div>
            </div>
          )
        })}

        {isStreaming &&
          messages.length > 0 &&
          messages[messages.length - 1]?.role === "user" && (
            <TypingIndicator />
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            rows={1}
            disabled={isStreaming}
            className={cn(
              "flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <Button
            type="submit"
            disabled={isStreaming || !inputText.trim()}
            className="shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}

export { ChatInterface }
export type { ChatInterfaceProps }
