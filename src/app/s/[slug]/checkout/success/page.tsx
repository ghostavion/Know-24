"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"

import type { OrderWithProduct } from "@/types/storefront"

type PageStatus = "loading" | "success" | "error"

export default function CheckoutSuccessPage() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()

  const slug = params.slug
  const sessionId = searchParams.get("session_id")

  const [status, setStatus] = useState<PageStatus>(
    sessionId ? "loading" : "success"
  )
  const [order, setOrder] = useState<OrderWithProduct | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const verifySession = async () => {
      try {
        const res = await fetch(
          `/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`
        )

        if (!res.ok) {
          setStatus("success")
          return
        }

        const data: { data?: OrderWithProduct } = await res.json()

        if (data.data) {
          setOrder(data.data)
        }

        setStatus("success")
      } catch {
        setStatus("success")
      }
    }

    verifySession()
  }, [sessionId])

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <div className="mx-auto size-12 animate-spin rounded-full border-4 border-[var(--sf-accent)] border-t-transparent" />
        <p className="mt-4 text-muted-foreground">
          Verifying your purchase...
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      {/* Checkmark Icon */}
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-600 dark:text-green-400"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="mt-6 text-3xl font-bold text-foreground">
        Thank you for your purchase!
      </h1>

      {/* Product info */}
      {order?.product && (
        <p className="mt-3 text-lg text-muted-foreground">
          You now have access to{" "}
          <span className="font-semibold text-foreground">
            {order.product.title}
          </span>
        </p>
      )}

      {/* Access info */}
      <p className="mt-4 text-muted-foreground">
        You&apos;ll receive an email with access details shortly.
      </p>

      {/* Order details */}
      {order && (
        <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6 text-left">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Order Details
          </h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Product</dt>
              <dd className="text-sm font-medium text-foreground">
                {order.product.title}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Amount</dt>
              <dd className="text-sm font-medium text-foreground">
                {order.amountCents === 0
                  ? "Free"
                  : `$${(order.amountCents / 100).toFixed(2)} ${order.currency.toUpperCase()}`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="text-sm font-medium capitalize text-green-600 dark:text-green-400">
                {order.status}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Back to storefront */}
      <Link
        href={`/s/${slug}`}
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[var(--sf-accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2"
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
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Back to storefront
      </Link>
    </div>
  )
}
