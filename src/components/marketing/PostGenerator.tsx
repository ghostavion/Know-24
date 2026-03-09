"use client"

import { useState } from "react"
import { Loader2, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PostGeneratorProps {
  businessId: string
}

type Platform = "twitter" | "linkedin" | "facebook" | "instagram"
type PostLength = "short" | "medium" | "long"

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "twitter", label: "Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
]

const LENGTHS: { value: PostLength; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
]

const PostGenerator = ({ businessId }: PostGeneratorProps) => {
  const [platform, setPlatform] = useState<Platform>("twitter")
  const [length, setLength] = useState<PostLength>("medium")
  const [topic, setTopic] = useState("")
  const [generatedPost, setGeneratedPost] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setGeneratedPost(null)
    setCopied(false)

    try {
      const res = await fetch("/api/marketing/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          platform,
          length,
          topic: topic.trim() || undefined,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to generate post")
      }

      const data: { post?: string } = await res.json()
      setGeneratedPost(data.post ?? "")
    } catch {
      setError("Failed to generate post. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedPost) return
    await navigator.clipboard.writeText(generatedPost)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setGeneratedPost(null)
    setTopic("")
    setCopied(false)
    setError(null)
  }

  return (
    <div className="space-y-5">
      {/* Platform selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Platform
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <Button
              key={p.value}
              variant={platform === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatform(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Length selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Length
        </label>
        <div className="flex flex-wrap gap-2">
          {LENGTHS.map((l) => (
            <Button
              key={l.value}
              variant={length === l.value ? "default" : "outline"}
              size="sm"
              onClick={() => setLength(l.value)}
            >
              {l.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Topic input */}
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Topic (optional)
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={2}
          placeholder="Enter a topic or leave blank for a general post..."
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Generate button */}
      {!generatedPost && (
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Generating..." : "Generate Post"}
        </Button>
      )}

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Generated post display */}
      {generatedPost !== null && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="whitespace-pre-wrap text-sm">{generatedPost}</div>

          <div className="flex items-center justify-between">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                "bg-muted text-muted-foreground"
              )}
            >
              {generatedPost.length} characters
            </span>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="size-3.5" />
                    Copied
                  </>
                ) : (
                  "Copy"
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Auto-saved to your post tray.
          </p>

          <Button variant="secondary" className="w-full" onClick={handleReset}>
            Generate Another
          </Button>
        </div>
      )}
    </div>
  )
}

export { PostGenerator }
export type { PostGeneratorProps }
