"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Loader2, CheckCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderData {
  orderId: string;
  downloadToken: string;
  ebookTitle: string;
  amountCents: number;
}

export default function EbookSuccessPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    sessionId ? "loading" : "error"
  );
  const [order, setOrder] = useState<OrderData | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const verify = async () => {
      try {
        const res = await fetch(
          `/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`
        );
        if (!res.ok) {
          setStatus("success"); // show generic success even if verify fails
          return;
        }
        const json = await res.json();
        if (json.data) {
          setOrder({
            orderId: json.data.id,
            downloadToken: json.data.downloadToken ?? json.data.download_token,
            ebookTitle: json.data.product?.title ?? "Your Ebook",
            amountCents: json.data.amountCents ?? json.data.amount_cents ?? 0,
          });
        }
        setStatus("success");
      } catch {
        setStatus("success");
      }
    };
    verify();
  }, [sessionId]);

  const handleDownload = async () => {
    if (!order?.downloadToken) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/orders/download?token=${encodeURIComponent(order.downloadToken)}`
      );
      const json = await res.json();
      if (json.data?.url) {
        window.open(json.data.url, "_blank");
      }
    } finally {
      setDownloading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto size-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md px-6 text-center">
        {/* Checkmark */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="size-10 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-foreground">
          Thank you for your purchase!
        </h1>

        {order && (
          <p className="mt-3 text-muted-foreground">
            You now own{" "}
            <span className="font-semibold text-foreground">
              {order.ebookTitle}
            </span>
          </p>
        )}

        <p className="mt-2 text-sm text-muted-foreground">
          A confirmation email with download links has been sent to your email.
        </p>

        {/* Download button */}
        {order?.downloadToken && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={cn(
              "mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3",
              "text-sm font-semibold text-primary-foreground",
              "hover:bg-primary/90 disabled:opacity-50 transition-colors"
            )}
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Download PDF
          </button>
        )}

        {/* Order details */}
        {order && (
          <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left text-sm">
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
              Order Details
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ebook</span>
                <span className="font-medium">{order.ebookTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  ${(order.amountCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Back links */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href={`/ebook/${params.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="size-4" />
            Back to ebook
          </Link>
          <Link
            href="/"
            className="text-sm text-primary hover:underline"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
