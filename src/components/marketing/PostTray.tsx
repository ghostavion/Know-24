"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Check, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PostTrayProps {
  businessId: string
}

interface SavedPost {
  id: string
  platform: string
  content: string
  length: string
  created_at: string
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  linkedin: "bg-blue-200 text-blue-900 dark:bg-blue-800/30 dark:text-blue-300",
  facebook: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  instagram: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
}

const SkeletonCard = () => (
  <div className="animate-pulse rounded-lg border p-4">
    <div className="flex items-center gap-2">
      <div className="h-5 w-16 rounded-full bg-muted" />
      <div className="h-5 w-12 rounded-full bg-muted" />
    </div>
    <div className="mt-3 space-y-2">
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-4/5 rounded bg-muted" />
      <div className="h-3 w-3/5 rounded bg-muted" />
    </div>
    <div className="mt-3 flex items-center justify-between">
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="flex gap-2">
        <div className="h-7 w-14 rounded bg-muted" />
        <div className="h-7 w-7 rounded bg-muted" />
      </div>
    </div>
  </div>
)

const PostTray = ({ businessId }: PostTrayProps) => {
  const [posts, setPosts] = useState<SavedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/marketing/posts?businessId=${businessId}`)
      if (res.ok) {
        const data: { posts?: SavedPost[] } = await res.json()
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

  const handleCopy = async (post: SavedPost) => {
    await navigator.clipboard.writeText(post.content)
    setCopiedId(post.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (postId: string) => {
    setDeletingId(postId)
    try {
      const res = await fetch(`/api/marketing/posts?postId=${postId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
      }
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Saved Posts</h4>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Saved Posts</h4>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No posts yet. Generate your first post above!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground">
        Saved Posts ({posts.length})
      </h4>

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="rounded-lg border p-4 transition hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  PLATFORM_COLORS[post.platform] ??
                    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                )}
              >
                {post.platform}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                {post.length}
              </span>
            </div>

            <p className="mt-2 line-clamp-3 text-sm">{post.content}</p>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDate(post.created_at)}
              </span>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(post)}
                >
                  {copiedId === post.id ? (
                    <>
                      <Check className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    "Copy"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                >
                  {deletingId === post.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5 text-destructive" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { PostTray }
export type { PostTrayProps }
