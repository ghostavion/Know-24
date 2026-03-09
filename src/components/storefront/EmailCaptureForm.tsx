"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

interface EmailCaptureFormProps {
  headline: string | null
  storefrontSlug: string
  businessName: string
}

type SubmitStatus = "idle" | "loading" | "success" | "error"

const EmailCaptureForm = ({
  headline,
  storefrontSlug,
  businessName,
}: EmailCaptureFormProps) => {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email.trim()) return

    setStatus("loading")
    setErrorMessage("")

    try {
      const res = await fetch(`/api/storefront/${storefrontSlug}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data: { error?: { message?: string } } = await res.json()
        throw new Error(data.error?.message ?? "Something went wrong. Please try again.")
      }

      setStatus("success")
      setEmail("")
      setFirstName("")
    } catch (err) {
      setStatus("error")
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      )
    }
  }

  return (
    <section id="lead-magnet" className="mx-auto max-w-7xl px-6 py-16">
      <div
        className={cn(
          "mx-auto max-w-xl rounded-2xl border-2 border-[var(--sf-accent)]/30 bg-background p-8 shadow-sm",
          "md:p-10"
        )}
      >
        <h2 className="text-center text-xl font-bold text-foreground md:text-2xl">
          {headline ?? `Stay updated from ${businessName}`}
        </h2>

        {status === "success" ? (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-center text-sm font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
            You're subscribed! Check your inbox for a confirmation.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="sf-firstname"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                First Name{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="sf-firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="sf-email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Email Address
              </label>
              <input
                id="sf-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)]"
              />
            </div>

            {status === "error" && errorMessage && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className={cn(
                "w-full rounded-lg bg-[var(--sf-accent)] px-6 py-3 text-sm font-semibold text-white",
                "transition-colors hover:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {status === "loading" ? "Subscribing..." : "Subscribe"}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              No spam, ever. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}

export { EmailCaptureForm }
export type { EmailCaptureFormProps }
