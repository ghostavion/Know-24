"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

interface CheckoutButtonProps {
  productId: string
  storefrontSlug: string
  priceCents: number | null
  pricingModel: string
  isLeadMagnet: boolean
}

type CheckoutStatus = "idle" | "loading" | "error"

const formatPrice = (cents: number): string => {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

const CheckoutButton = ({
  productId,
  storefrontSlug,
  priceCents,
  pricingModel,
  isLeadMagnet,
}: CheckoutButtonProps) => {
  const [showModal, setShowModal] = useState(false)
  const [customerEmail, setCustomerEmail] = useState("")
  const [status, setStatus] = useState<CheckoutStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const isFree = isLeadMagnet || pricingModel === "free" || priceCents === 0

  const buttonLabel = isFree
    ? "Get Free Access"
    : `Buy Now${priceCents ? ` - ${formatPrice(priceCents)}` : ""}`

  const handleCheckout = async () => {
    if (!customerEmail.trim()) return

    setStatus("loading")
    setErrorMessage("")

    try {
      if (isFree) {
        const res = await fetch(`/api/storefront/${storefrontSlug}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: customerEmail.trim() }),
        })

        if (!res.ok) {
          const data: { error?: { message?: string } } = await res.json()
          throw new Error(data.error?.message ?? "Failed to process request.")
        }

        setShowModal(false)
        setCustomerEmail("")
        setStatus("idle")
        // For free products, reload to show success state
        window.location.reload()
      } else {
        const res = await fetch("/api/checkout/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            storefrontSlug,
            customerEmail: customerEmail.trim(),
          }),
        })

        if (!res.ok) {
          const data: { error?: { message?: string } } = await res.json()
          throw new Error(data.error?.message ?? "Failed to create checkout session.")
        }

        const data: { data?: { url: string } } = await res.json()

        if (data.data?.url) {
          window.location.href = data.data.url
        } else {
          throw new Error("No checkout URL returned.")
        }
      }
    } catch (err) {
      setStatus("error")
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      )
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={cn(
          "w-full rounded-lg bg-[var(--sf-accent)] px-8 py-3 text-sm font-semibold text-white",
          "transition-colors hover:opacity-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2"
        )}
      >
        {buttonLabel}
      </button>

      {/* Email Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (status !== "loading") {
                setShowModal(false)
                setStatus("idle")
                setErrorMessage("")
              }
            }}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {isFree ? "Enter your email" : "Complete your purchase"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (status !== "loading") {
                    setShowModal(false)
                    setStatus("idle")
                    setErrorMessage("")
                  }
                }}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {isFree
                ? "Enter your email to get instant access."
                : "Enter your email and we'll take you to secure checkout."}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="checkout-email"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Email Address
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customerEmail.trim()) {
                      handleCheckout()
                    }
                  }}
                  placeholder="you@example.com"
                  disabled={status === "loading"}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {status === "error" && errorMessage && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={status === "loading" || !customerEmail.trim()}
                className={cn(
                  "w-full rounded-lg bg-[var(--sf-accent)] px-6 py-3 text-sm font-semibold text-white",
                  "transition-colors hover:opacity-90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {status === "loading"
                  ? "Processing..."
                  : isFree
                    ? "Get Access"
                    : "Continue to Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export { CheckoutButton }
export type { CheckoutButtonProps }
