"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Loader2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Ebook {
  id: string;
  title: string;
  subtitle: string | null;
  niche: string;
  status: string;
  total_words: number | null;
  total_pages: number | null;
  cover_url: string | null;
  pdf_url: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-500" },
  generating: { label: "Generating...", color: "bg-yellow-500" },
  reviewing: { label: "Ready for Review", color: "bg-blue-500" },
  published: { label: "Published", color: "bg-green-500" },
  archived: { label: "Archived", color: "bg-muted-foreground" },
};

export default function EbooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchEbooks = useCallback(async () => {
    try {
      const res = await fetch("/api/ebooks");
      const json = await res.json();
      if (json.data) setEbooks(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEbooks();
  }, [fetchEbooks]);

  // Auto-create from research flow
  useEffect(() => {
    const researchRunId = searchParams.get("research");
    const niche = searchParams.get("niche");

    if (researchRunId && niche && !creating) {
      setCreating(true);
      fetch("/api/ebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, researchRunId }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.data?.ebookId) {
            router.replace(`/ebooks/${json.data.ebookId}`);
          }
        })
        .finally(() => setCreating(false));
    }
  }, [searchParams, router, creating]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">My Ebooks</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border p-6">
              <div className="h-32 rounded-lg bg-muted" />
              <div className="mt-4 h-5 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Ebooks</h1>
          <p className="text-sm text-muted-foreground">{ebooks.length} ebook{ebooks.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/research"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Ebook
        </Link>
      </div>

      {creating && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <Loader2 className="size-5 animate-spin text-primary" />
          <p className="text-sm font-medium">Creating your ebook from research...</p>
        </div>
      )}

      {ebooks.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="size-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No ebooks yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Start by researching a niche. We&apos;ll find the perfect ebook to create, then generate it with AI.
          </p>
          <Link
            href="/research"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Research a Niche
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ebooks.map((ebook) => {
            const st = statusConfig[ebook.status] ?? statusConfig.draft;
            return (
              <Link
                key={ebook.id}
                href={`/ebooks/${ebook.id}`}
                className="group rounded-xl border bg-card transition-colors hover:border-primary/30"
              >
                {/* Cover */}
                <div className="relative aspect-[3/2] overflow-hidden rounded-t-xl bg-muted">
                  {ebook.cover_url ? (
                    <img
                      src={ebook.cover_url}
                      alt={ebook.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="size-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                    <span className={cn("size-2 rounded-full", st.color)} />
                    {st.label}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-primary">{ebook.title}</h3>
                  {ebook.subtitle && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{ebook.subtitle}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {ebook.total_pages && (
                      <span className="flex items-center gap-1">
                        <FileText className="size-3" />
                        {ebook.total_pages} pages
                      </span>
                    )}
                    {ebook.pdf_url && (
                      <span className="flex items-center gap-1 text-green-600">
                        <FileText className="size-3" />
                        PDF
                      </span>
                    )}
                    {ebook.cover_url && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <ImageIcon className="size-3" />
                        Cover
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(ebook.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
