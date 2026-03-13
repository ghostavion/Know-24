"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Check,
  Download,
  Globe,
  Pencil,
  Save,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EbookChapter {
  title: string;
  content: string;
  wordCount: number;
}

interface Cover {
  id: string;
  image_url: string;
  prompt: string;
  selected: boolean;
  created_at: string;
}

interface EbookData {
  id: string;
  title: string;
  subtitle: string | null;
  niche: string;
  status: string;
  chapters: EbookChapter[];
  total_words: number | null;
  total_pages: number | null;
  cover_url: string | null;
  pdf_url: string | null;
  target_price: number | null;
  published_at: string | null;
  created_at: string;
}

type Tab = "chapters" | "covers" | "publish";

export default function EbookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ebook, setEbook] = useState<EbookData | null>(null);
  const [covers, setCovers] = useState<Cover[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("chapters");
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishPrice, setPublishPrice] = useState("29");
  const [rewritingChapter, setRewritingChapter] = useState<number | null>(null);

  const fetchEbook = useCallback(async () => {
    const res = await fetch(`/api/ebooks/${id}`);
    const json = await res.json();
    if (json.data) setEbook(json.data);
    setLoading(false);
  }, [id]);

  const fetchCovers = useCallback(async () => {
    const res = await fetch(`/api/ebooks/${id}/covers`);
    const json = await res.json();
    if (json.data) setCovers(json.data);
  }, [id]);

  useEffect(() => {
    fetchEbook();
    fetchCovers();
  }, [fetchEbook, fetchCovers]);

  // Poll for generating status
  useEffect(() => {
    if (ebook?.status !== "generating") return;
    const interval = setInterval(fetchEbook, 3000);
    return () => clearInterval(interval);
  }, [ebook?.status, fetchEbook]);

  const saveChapter = async (chapterIdx: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/ebooks/${id}/chapters/${chapterIdx}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        await fetchEbook();
        setEditingChapter(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const rewriteChapter = async (chapterIdx: number) => {
    setRewritingChapter(chapterIdx);
    try {
      const res = await fetch(`/api/ebooks/${id}/chapters/${chapterIdx}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewrite: true }),
      });
      if (res.ok) {
        await fetchEbook();
      }
    } finally {
      setRewritingChapter(null);
    }
  };

  const generateCover = async (style: string) => {
    setGeneratingCover(true);
    try {
      await fetch(`/api/ebooks/${id}/covers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style }),
      });
      await fetchCovers();
      await fetchEbook();
    } finally {
      setGeneratingCover(false);
    }
  };

  const selectCover = async (coverId: string) => {
    await fetch(`/api/ebooks/${id}/covers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverId }),
    });
    await fetchCovers();
    await fetchEbook();
  };

  const publishEbook = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/ebooks/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(publishPrice) }),
      });
      if (res.ok) {
        await fetchEbook();
        setActiveTab("chapters");
      }
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Ebook not found</p>
        <Link
          href="/ebooks"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Back to Ebooks
        </Link>
      </div>
    );
  }

  const isGenerating = ebook.status === "generating";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/ebooks"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-1.5 text-sm transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{ebook.title}</h1>
            {ebook.subtitle && <p className="text-sm text-muted-foreground">{ebook.subtitle}</p>}
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{ebook.total_pages ?? "—"} pages</span>
              <span>{ebook.total_words?.toLocaleString() ?? "—"} words</span>
              <span>{ebook.chapters?.length ?? 0} chapters</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ebook.pdf_url && (
            <a
              href={ebook.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Download className="size-4" />
              PDF
            </a>
          )}
          {ebook.status === "published" && (
            <Button variant="outline" size="sm">
              <Globe className="size-4" />
              View Storefront
            </Button>
          )}
        </div>
      </div>

      {/* Generating banner */}
      {isGenerating && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <Loader2 className="size-5 animate-spin text-yellow-600" />
          <div>
            <p className="text-sm font-medium">Generating your ebook...</p>
            <p className="text-xs text-muted-foreground">
              This usually takes 2-5 minutes. The page will update automatically.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!isGenerating && (
        <>
          <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
            {(["chapters", "covers", "publish"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "chapters" && <BookOpen className="size-4" />}
                {tab === "covers" && <ImageIcon className="size-4" />}
                {tab === "publish" && <Globe className="size-4" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Chapters Tab */}
          {activeTab === "chapters" && (
            <div className="space-y-4">
              {(ebook.chapters ?? []).map((chapter, idx) => (
                <div key={idx} className="rounded-xl border bg-card">
                  <div className="flex items-center justify-between border-b px-5 py-3">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Chapter {idx + 1}</span>
                      <h3 className="font-semibold">{chapter.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{chapter.wordCount} words</span>
                      {editingChapter === idx ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingChapter(null)}
                          >
                            <X className="size-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveChapter(idx)}
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                            Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rewriteChapter(idx)}
                            disabled={rewritingChapter === idx}
                          >
                            {rewritingChapter === idx ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Sparkles className="size-3" />
                            )}
                            Rewrite (5 cr)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingChapter(idx);
                              setEditContent(chapter.content);
                            }}
                          >
                            <Pencil className="size-3" />
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    {editingChapter === idx ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[300px] w-full resize-y rounded-lg border bg-background p-4 text-sm leading-relaxed outline-none focus:border-primary"
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground/80">
                        {chapter.content.split("\n\n").map((p, pi) => (
                          <p key={pi}>{p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Covers Tab */}
          {activeTab === "covers" && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {["minimalist", "bold", "photographic", "illustrated", "gradient"].map((style) => (
                  <Button
                    key={style}
                    variant="outline"
                    size="sm"
                    onClick={() => generateCover(style)}
                    disabled={generatingCover}
                  >
                    {generatingCover ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                    <span className="text-muted-foreground">(10 cr)</span>
                  </Button>
                ))}
              </div>

              {covers.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed p-12 text-center">
                  <ImageIcon className="mx-auto size-10 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No covers generated yet. Choose a style above to generate one.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {covers.map((cover) => (
                    <div
                      key={cover.id}
                      className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-colors",
                        cover.selected ? "border-primary" : "border-transparent hover:border-primary/30"
                      )}
                      onClick={() => selectCover(cover.id)}
                    >
                      <img
                        src={cover.image_url}
                        alt="Cover option"
                        className="aspect-[3/4] w-full object-cover"
                      />
                      {cover.selected && (
                        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="size-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Publish Tab */}
          {activeTab === "publish" && (
            <div className="space-y-6 rounded-xl border bg-card p-6">
              {ebook.status === "published" ? (
                <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4">
                  <Check className="size-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-600">Published</p>
                    <p className="text-sm text-muted-foreground">
                      Published on {new Date(ebook.published_at!).toLocaleDateString()} at ${ebook.target_price}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold">Publish to Storefront</h3>
                    <p className="text-sm text-muted-foreground">
                      Set your price and make your ebook available for purchase.
                    </p>
                  </div>

                  {/* Pre-flight checks */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {ebook.pdf_url ? (
                        <Check className="size-4 text-green-500" />
                      ) : (
                        <Loader2 className="size-4 animate-spin text-yellow-500" />
                      )}
                      PDF generated
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {ebook.cover_url ? (
                        <Check className="size-4 text-green-500" />
                      ) : (
                        <X className="size-4 text-muted-foreground" />
                      )}
                      Cover selected
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Price (USD)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-muted-foreground">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={publishPrice}
                        onChange={(e) => setPublishPrice(e.target.value)}
                        className="w-32 rounded-lg border bg-background px-4 py-2.5 text-lg font-semibold outline-none focus:border-primary"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Set to 0 for free</p>
                  </div>

                  <Button
                    onClick={publishEbook}
                    disabled={publishing || !ebook.pdf_url}
                    className="w-full"
                    size="lg"
                  >
                    {publishing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Globe className="size-4" />
                    )}
                    Publish Ebook
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
