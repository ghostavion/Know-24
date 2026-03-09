"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, ArrowLeft, Trash2, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BlogPostListProps {
  businessId: string
  businessName: string
}

interface BlogPost {
  id: string
  title: string
  body: string
  excerpt: string | null
  status: "draft" | "published" | "archived"
  view_count: number
  created_at: string
  updated_at: string
}

type ViewMode = "list" | "editor"

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

const SkeletonRow = () => (
  <div className="animate-pulse border-b p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
      </div>
      <div className="h-4 w-12 rounded bg-muted" />
    </div>
  </div>
)

const BlogPostList = ({ businessId, businessName }: BlogPostListProps) => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<ViewMode>("list")
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)

  // Editor form state
  const [formTitle, setFormTitle] = useState("")
  const [formBody, setFormBody] = useState("")
  const [formExcerpt, setFormExcerpt] = useState("")
  const [formStatus, setFormStatus] = useState<"draft" | "published">("draft")

  // AI generation state
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiTone, setAiTone] = useState("professional")
  const [generating, setGenerating] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/marketing/blog?businessId=${businessId}`)
      if (res.ok) {
        const data: { posts?: BlogPost[] } = await res.json()
        setPosts(data.posts ?? [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const openEditor = (post: BlogPost | null) => {
    if (post) {
      setEditingPost(post)
      setFormTitle(post.title)
      setFormBody(post.body)
      setFormExcerpt(post.excerpt ?? "")
      setFormStatus(post.status === "archived" ? "draft" : post.status)
    } else {
      setEditingPost(null)
      setFormTitle("")
      setFormBody("")
      setFormExcerpt("")
      setFormStatus("draft")
    }
    setMode("editor")
  }

  const backToList = () => {
    setMode("list")
    setEditingPost(null)
    setShowAiModal(false)
    fetchPosts()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        businessId,
        title: formTitle,
        body: formBody,
        excerpt: formExcerpt || null,
        status: formStatus,
      }

      if (editingPost) {
        await fetch("/api/marketing/blog", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, postId: editingPost.id }),
        })
      } else {
        await fetch("/api/marketing/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      backToList()
    } catch {
      // Silently fail
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingPost) return
    setSaving(true)
    try {
      await fetch("/api/marketing/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: editingPost.id,
          status: "archived",
        }),
      })
      backToList()
    } catch {
      // Silently fail
    } finally {
      setSaving(false)
    }
  }

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return
    setGenerating(true)
    try {
      const res = await fetch("/api/marketing/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          topic: aiTopic.trim(),
          tone: aiTone,
        }),
      })

      if (res.ok) {
        const data: { title?: string; body?: string; excerpt?: string } =
          await res.json()
        setEditingPost(null)
        setFormTitle(data.title ?? "")
        setFormBody(data.body ?? "")
        setFormExcerpt(data.excerpt ?? "")
        setFormStatus("draft")
        setShowAiModal(false)
        setAiTopic("")
        setMode("editor")
      }
    } catch {
      // Silently fail
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Editor mode
  if (mode === "editor") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={backToList} disabled={saving}>
            <ArrowLeft className="size-3.5" />
            Back to list
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Title
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Post title..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Body
            </label>
            <textarea
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              placeholder="Write your blog post..."
              className="min-h-[300px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Excerpt
            </label>
            <textarea
              value={formExcerpt}
              onChange={(e) => setFormExcerpt(e.target.value)}
              rows={2}
              placeholder="Brief summary for previews..."
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              value={formStatus}
              onChange={(e) =>
                setFormStatus(e.target.value as "draft" | "published")
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !formTitle.trim()}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {editingPost ? "Update Post" : "Create Post"}
            </Button>

            {editingPost && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 className="size-3.5" />
                Archive
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // List mode
  return (
    <div className="space-y-4">
      {/* AI generation modal */}
      {showAiModal && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <h4 className="text-sm font-semibold">Generate Blog Post with AI</h4>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Topic
            </label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="What should the post be about?"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Tone
            </label>
            <select
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="authoritative">Authoritative</option>
              <option value="friendly">Friendly</option>
              <option value="educational">Educational</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAiGenerate}
              disabled={generating || !aiTopic.trim()}
            >
              {generating && <Loader2 className="size-3.5 animate-spin" />}
              {generating ? "Generating..." : "Generate"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowAiModal(false)}
              disabled={generating}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!showAiModal && (
        <div className="flex gap-2">
          <Button onClick={() => openEditor(null)}>Create New Post</Button>
          <Button variant="secondary" onClick={() => setShowAiModal(true)}>
            <Sparkles className="size-3.5" />
            Generate with AI
          </Button>
        </div>
      )}

      {/* Post list */}
      {loading ? (
        <div className="rounded-lg border">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No blog posts yet for {businessName}. Create your first post!
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          {posts.map((post, index) => (
            <button
              key={post.id}
              type="button"
              onClick={() => openEditor(post)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between p-4 text-left transition hover:bg-muted/50",
                index < posts.length - 1 && "border-b"
              )}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-medium">{post.title}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      STATUS_COLORS[post.status] ?? STATUS_COLORS.draft
                    )}
                  >
                    {post.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(post.created_at)}
                  </span>
                </div>
              </div>
              <div className="ml-4 text-right">
                <span className="text-sm text-muted-foreground">
                  {post.view_count} views
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { BlogPostList }
export type { BlogPostListProps }
