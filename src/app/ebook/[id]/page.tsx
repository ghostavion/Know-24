"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ShoppingCart,
  Loader2,
  Star,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicEbook {
  id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  description: string | null;
  total_pages: number | null;
  total_words: number | null;
  target_price: number | null;
  niche: string | null;
  cover_url: string | null;
  published_at: string | null;
  chapter_count: number;
}

export default function PublicEbookPage() {
  const params = useParams<{ id: string }>();
  const [ebook, setEbook] = useState<PublicEbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ebooks/${params.id}/public`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setEbook(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBuying(true);
    setError(null);

    try {
      const res = await fetch(`/api/ebooks/${params.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerEmail: email }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        setError(json.error?.message ?? "Checkout failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <BookOpen className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Ebook Not Found</h1>
        <p className="text-muted-foreground">
          This ebook may have been removed or is not yet published.
        </p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Go Home
        </Link>
      </div>
    );
  }

  const price = ebook.target_price ?? 9.99;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Know24
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          {/* Left — Details */}
          <div>
            {ebook.niche && (
              <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {ebook.niche}
              </span>
            )}
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {ebook.title}
            </h1>
            {ebook.subtitle && (
              <p className="mt-2 text-xl text-muted-foreground">
                {ebook.subtitle}
              </p>
            )}
            {ebook.author_name && (
              <p className="mt-3 text-sm text-muted-foreground">
                by{" "}
                <span className="font-medium text-foreground">
                  {ebook.author_name}
                </span>
              </p>
            )}

            {ebook.description && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">About This Book</h2>
                <p className="mt-2 whitespace-pre-line text-muted-foreground">
                  {ebook.description}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              {ebook.chapter_count > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="size-4" />
                  {ebook.chapter_count} chapters
                </div>
              )}
              {ebook.total_pages && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="size-4" />
                  {ebook.total_pages} pages
                </div>
              )}
              {ebook.total_words && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="size-4" />
                  {Math.round(ebook.total_words / 1000)}k words
                </div>
              )}
            </div>
          </div>

          {/* Right — Buy Card */}
          <div className="lg:sticky lg:top-8">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {/* Cover */}
              {ebook.cover_url ? (
                <img
                  src={ebook.cover_url}
                  alt={ebook.title}
                  className="aspect-[3/4] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <BookOpen className="size-16 text-primary/30" />
                </div>
              )}

              <div className="p-6">
                <div className="text-3xl font-bold text-foreground">
                  ${price.toFixed(2)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Instant PDF download after purchase
                </p>

                <form onSubmit={handleBuy} className="mt-6 space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className={cn(
                      "w-full rounded-lg border border-border bg-background px-4 py-2.5",
                      "text-sm placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    )}
                  />
                  <button
                    type="submit"
                    disabled={buying}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3",
                      "text-sm font-semibold text-primary-foreground",
                      "hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    )}
                  >
                    {buying ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="size-4" />
                    )}
                    {buying ? "Redirecting..." : `Buy Now — $${price.toFixed(2)}`}
                  </button>
                </form>

                {error && (
                  <p className="mt-3 text-sm text-red-600">{error}</p>
                )}

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
