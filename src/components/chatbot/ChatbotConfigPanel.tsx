"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Save, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ChatbotConfig } from "@/types/chatbot"

interface ChatbotConfigPanelProps {
  productId: string
  businessId: string
}

type SaveStatus = "idle" | "saving" | "success" | "error"

interface FormState {
  systemPrompt: string
  personality: string
  suggestProducts: boolean
  maxResponseTokens: number
}

const TOKEN_OPTIONS = [
  { value: 256, label: "256 tokens (short)" },
  { value: 512, label: "512 tokens (medium)" },
  { value: 1024, label: "1024 tokens (standard)" },
  { value: 2048, label: "2048 tokens (long)" },
] as const

const PREVIEW_MESSAGES = [
  { role: "user" as const, content: "What can you help me with?" },
  {
    role: "assistant" as const,
    content:
      "I can answer questions about this product, provide information from the knowledge base, and help you find what you need. What would you like to know?",
  },
]

const SkeletonForm = () => (
  <div className="animate-pulse space-y-6">
    <div className="space-y-2">
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="h-24 w-full rounded-lg bg-muted" />
    </div>
    <div className="space-y-2">
      <div className="h-4 w-24 rounded bg-muted" />
      <div className="h-10 w-full rounded-lg bg-muted" />
    </div>
    <div className="space-y-2">
      <div className="h-4 w-28 rounded bg-muted" />
      <div className="h-10 w-full rounded-lg bg-muted" />
    </div>
    <div className="flex items-center gap-2">
      <div className="size-5 rounded bg-muted" />
      <div className="h-4 w-40 rounded bg-muted" />
    </div>
  </div>
)

const ChatbotConfigPanel = ({
  productId,
  businessId,
}: ChatbotConfigPanelProps) => {
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [form, setForm] = useState<FormState>({
    systemPrompt: "",
    personality: "",
    suggestProducts: true,
    maxResponseTokens: 1024,
  })

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ productId })
      const res = await fetch(`/api/chatbot/config?${params.toString()}`)

      if (!res.ok) {
        throw new Error("Failed to load chatbot configuration")
      }

      const json: { data?: ChatbotConfig; error?: { message: string } } =
        await res.json()

      if (json.data) {
        setForm({
          systemPrompt: json.data.systemPrompt ?? "",
          personality: json.data.personality ?? "",
          suggestProducts: json.data.suggestProducts,
          maxResponseTokens: json.data.maxResponseTokens,
        })
      }
    } catch {
      setErrorMessage("Failed to load configuration")
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    setSaveStatus("saving")
    setErrorMessage("")

    try {
      const res = await fetch("/api/chatbot/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          businessId,
          systemPrompt: form.systemPrompt || null,
          personality: form.personality || null,
          suggestProducts: form.suggestProducts,
          maxResponseTokens: form.maxResponseTokens,
        }),
      })

      if (!res.ok) {
        const json: { error?: { message?: string } } = await res.json()
        throw new Error(json.error?.message ?? "Failed to save configuration")
      }

      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (err) {
      setSaveStatus("error")
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save configuration"
      )
    }
  }

  const updateForm = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (saveStatus === "success") {
      setSaveStatus("idle")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h3 className="text-lg font-semibold text-foreground">
          Chatbot Configuration
        </h3>
        <SkeletonForm />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Chatbot Configuration
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize how your AI chatbot responds to customers.
        </p>
      </div>

      {/* Configuration form */}
      <div className="space-y-6">
        {/* System Prompt */}
        <div>
          <label
            htmlFor="chatbot-system-prompt"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            System Prompt
          </label>
          <p className="mb-2 text-xs text-muted-foreground">
            Custom instructions for the AI. Tell it how to behave, what topics
            to focus on, or what information to prioritize.
          </p>
          <textarea
            id="chatbot-system-prompt"
            value={form.systemPrompt}
            onChange={(e) => updateForm("systemPrompt", e.target.value)}
            rows={5}
            placeholder="e.g., You are an expert in digital marketing. Focus on actionable advice and always suggest relevant resources when appropriate."
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          />
        </div>

        {/* Personality */}
        <div>
          <label
            htmlFor="chatbot-personality"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Personality
          </label>
          <p className="mb-2 text-xs text-muted-foreground">
            Describe the tone and style of the chatbot.
          </p>
          <input
            id="chatbot-personality"
            type="text"
            value={form.personality}
            onChange={(e) => updateForm("personality", e.target.value)}
            placeholder="e.g., Friendly and casual, Professional and formal"
            className={cn(
              "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          />
        </div>

        {/* Max Response Length */}
        <div>
          <label
            htmlFor="chatbot-max-tokens"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Max Response Length
          </label>
          <select
            id="chatbot-max-tokens"
            value={form.maxResponseTokens}
            onChange={(e) =>
              updateForm("maxResponseTokens", Number(e.target.value))
            }
            className={cn(
              "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            {TOKEN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Suggest Products */}
        <div className="flex items-start gap-3">
          <input
            id="chatbot-suggest-products"
            type="checkbox"
            checked={form.suggestProducts}
            onChange={(e) => updateForm("suggestProducts", e.target.checked)}
            className="mt-0.5 size-4 rounded border-border accent-primary"
          />
          <div>
            <label
              htmlFor="chatbot-suggest-products"
              className="text-sm font-medium text-foreground"
            >
              Suggest Products
            </label>
            <p className="text-xs text-muted-foreground">
              Allow the chatbot to recommend other products from your business
              when relevant.
            </p>
          </div>
        </div>

        {/* Error message */}
        {saveStatus === "error" && errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="w-full sm:w-auto"
        >
          {saveStatus === "saving" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : saveStatus === "success" ? (
            <>
              <Check className="size-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      {/* Preview section */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Chat Preview
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            A preview of how the chatbot will look and respond.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          {/* Preview header */}
          <div className="border-b bg-muted/50 px-4 py-2.5">
            <p className="text-xs font-medium text-foreground">
              Chat Preview
            </p>
          </div>

          {/* Preview messages */}
          <div className="space-y-3 p-4">
            {PREVIEW_MESSAGES.map((msg, index) => {
              const isUser = msg.role === "user"

              return (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      isUser
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            })}

            {form.personality && (
              <p className="text-center text-xs text-muted-foreground">
                Personality: {form.personality}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { ChatbotConfigPanel }
export type { ChatbotConfigPanelProps }
