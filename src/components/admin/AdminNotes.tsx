"use client";

import { useState } from "react";
import { MessageSquare, Plus, Loader2 } from "lucide-react";

interface AdminNote {
  id: string;
  adminUserId: string;
  content: string;
  createdAt: string;
}

interface AdminNotesProps {
  userId: string;
  initialNotes: AdminNote[];
}

export const AdminNotes = ({ userId, initialNotes }: AdminNotesProps) => {
  const [notes, setNotes] = useState<AdminNote[]>(initialNotes);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);

    // Optimistically add the note
    const tempId = crypto.randomUUID();
    const optimisticNote: AdminNote = {
      id: tempId,
      adminUserId: "you",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [optimisticNote, ...prev]);
    setContent("");

    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        // Revert on failure
        setNotes((prev) => prev.filter((n) => n.id !== tempId));
        setContent(trimmed);
      } else {
        const created = (await res.json()) as AdminNote;
        // Replace temp with real note
        setNotes((prev) =>
          prev.map((n) => (n.id === tempId ? created : n))
        );
      }
    } catch {
      // Revert on network error
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      setContent(trimmed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-[#7C3AED]" />
        <h3 className="text-sm font-semibold text-foreground">Admin Notes</h3>
      </div>

      {/* Add note form */}
      <div className="mb-4 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add an internal note..."
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#7C3AED]/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Add Note
        </button>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {note.content}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
