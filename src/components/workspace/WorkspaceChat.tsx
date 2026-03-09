"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";

interface WorkspaceChatProps {
  businessId: string;
  businessName: string;
}

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
  );
};

const WorkspaceChat = ({ businessId, businessName }: WorkspaceChatProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/workspace",
      body: { businessId },
    }),
    messages: [
      {
        id: "greeting",
        role: "assistant",
        parts: [
          {
            type: "text" as const,
            text: `Hi! I'm your AI assistant for ${businessName}. I can help you manage products, check analytics, update your storefront, and more. What would you like to do?`,
          },
        ],
      },
    ],
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    setInput("");
    sendMessage({ text });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message, index: number) => {
          const role = message.role as string;
          if (role !== "user" && role !== "assistant") return null;
          const textContent = message.parts
            ?.filter(
              (p): p is Extract<typeof p, { type: "text" }> =>
                p.type === "text"
            )
            .map((p) => p.text)
            .join("");
          if (!textContent) return null;
          const isLastAssistant =
            role === "assistant" &&
            isStreaming &&
            index === messages.length - 1;

          return (
            <ChatMessage
              key={message.id}
              role={role as "user" | "assistant"}
              content={textContent}
              isStreaming={isLastAssistant}
            />
          );
        })}
        {isStreaming && (messages[messages.length - 1]?.role as string) === "user" && (
          <TypingIndicator />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask me anything about your business..."
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
            type="button"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
          >
            Send
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Scoped to {businessName}
        </p>
      </div>
    </div>
  );
};

export { WorkspaceChat };
export type { WorkspaceChatProps };
