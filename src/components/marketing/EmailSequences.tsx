"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Trash2, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmailSequencesProps {
  businessId: string
}

interface EmailSequence {
  id: string
  type: string
  name: string
  subject_template: string
  body_template: string
  delay_hours: number
  is_active: boolean
  created_at: string
}

const SEQUENCE_TYPES = [
  { value: "welcome", label: "Welcome" },
  { value: "nurture", label: "Nurture" },
  { value: "launch", label: "Launch" },
  { value: "re-engagement", label: "Re-engagement" },
  { value: "custom", label: "Custom" },
]

const TYPE_COLORS: Record<string, string> = {
  welcome: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  nurture: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  launch: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "re-engagement":
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  custom: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

const SkeletonCard = () => (
  <div className="animate-pulse rounded-lg border p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-3 w-48 rounded bg-muted" />
      </div>
      <div className="h-6 w-12 rounded-full bg-muted" />
    </div>
  </div>
)

const EmailSequences = ({ businessId }: EmailSequencesProps) => {
  const [sequences, setSequences] = useState<EmailSequence[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [formType, setFormType] = useState("welcome")
  const [formName, setFormName] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formBody, setFormBody] = useState("")
  const [formDelayHours, setFormDelayHours] = useState("24")

  const fetchSequences = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/email/sequences?businessId=${businessId}`)
      if (res.ok) {
        const data: { sequences?: EmailSequence[] } = await res.json()
        setSequences(data.sequences ?? [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchSequences()
  }, [fetchSequences])

  const resetForm = () => {
    setFormType("welcome")
    setFormName("")
    setFormSubject("")
    setFormBody("")
    setFormDelayHours("24")
    setShowForm(false)
  }

  const handleCreate = async () => {
    if (!formName.trim() || !formSubject.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/email/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          type: formType,
          name: formName.trim(),
          subjectTemplate: formSubject.trim(),
          bodyTemplate: formBody.trim(),
          delayHours: parseInt(formDelayHours, 10) || 24,
        }),
      })
      if (res.ok) {
        resetForm()
        await fetchSequences()
      }
    } catch {
      // Silently fail
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (sequence: EmailSequence) => {
    setTogglingId(sequence.id)
    try {
      await fetch("/api/email/sequences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequenceId: sequence.id,
          isActive: !sequence.is_active,
        }),
      })
      setSequences((prev) =>
        prev.map((s) =>
          s.id === sequence.id ? { ...s, is_active: !s.is_active } : s
        )
      )
    } catch {
      // Silently fail
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (sequenceId: string) => {
    setDeletingId(sequenceId)
    try {
      const res = await fetch(`/api/email/sequences?sequenceId=${sequenceId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setSequences((prev) => prev.filter((s) => s.id !== sequenceId))
      }
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null)
    }
  }

  const formatDelay = (hours: number): string => {
    if (hours < 24) return `Send after ${hours} hour${hours === 1 ? "" : "s"}`
    const days = Math.floor(hours / 24)
    return `Send after ${days} day${days === 1 ? "" : "s"}`
  }

  // Group sequences by type
  const groupedSequences = SEQUENCE_TYPES.reduce<
    Record<string, EmailSequence[]>
  >((acc, st) => {
    const matching = sequences.filter((s) => s.type === st.value)
    if (matching.length > 0) {
      acc[st.value] = matching
    }
    return acc
  }, {})

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Create form */}
      {showForm ? (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <h4 className="text-sm font-semibold">Create Email Sequence</h4>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Type
            </label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SEQUENCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Sequence name..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Subject Template
            </label>
            <input
              type="text"
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              placeholder="Email subject line..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Body Template
            </label>
            <textarea
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={4}
              placeholder="Email body content..."
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Delay (hours)
            </label>
            <input
              type="number"
              min="0"
              value={formDelayHours}
              onChange={(e) => setFormDelayHours(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={saving || !formName.trim() || !formSubject.trim()}
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Save Sequence
            </Button>
            <Button variant="ghost" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-3.5" />
          Create Sequence
        </Button>
      )}

      {/* Empty state */}
      {sequences.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No email sequences configured. Create your first to automate
            engagement.
          </p>
        </div>
      )}

      {/* Grouped sequences */}
      {Object.entries(groupedSequences).map(([type, typeSequences]) => {
        const typeLabel =
          SEQUENCE_TYPES.find((t) => t.value === type)?.label ?? type
        return (
          <div key={type} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {typeLabel}
            </h4>
            <div className="space-y-2">
              {typeSequences.map((sequence) => (
                <div
                  key={sequence.id}
                  className="rounded-lg border p-4 transition hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{sequence.name}</p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            TYPE_COLORS[sequence.type] ?? TYPE_COLORS.custom
                          )}
                        >
                          {sequence.type}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        Subject: {sequence.subject_template}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDelay(sequence.delay_hours)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Active/Inactive toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggle(sequence)}
                        disabled={togglingId === sequence.id}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          sequence.is_active ? "bg-primary" : "bg-input"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block size-5 rounded-full bg-background shadow-sm ring-0 transition-transform",
                            sequence.is_active
                              ? "translate-x-5"
                              : "translate-x-0"
                          )}
                        />
                      </button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(sequence.id)}
                        disabled={deletingId === sequence.id}
                      >
                        {deletingId === sequence.id ? (
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
      })}
    </div>
  )
}

export { EmailSequences }
export type { EmailSequencesProps }
