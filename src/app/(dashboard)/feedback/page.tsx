"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, ExternalLink, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface FeedbackItem {
  id: string;
  clerk_user_id: string | null;
  session_id: string | null;
  status: string;
  page_url: string;
  page_route: string | null;
  element_tag: string | null;
  element_text: string | null;
  element_id: string | null;
  element_class: string | null;
  message: string;
  category: string;
  severity: string;
  context_logs: unknown[] | null;
  browser_info: Record<string, unknown> | null;
  screenshot_base64: string | null;
  dev_response: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

type StatusFilter = "all" | "open" | "in-progress" | "resolved" | "wont-fix";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: "Open", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: AlertCircle },
  "in-progress": { label: "In Progress", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Clock },
  resolved: { label: "Resolved", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 },
  "wont-fix": { label: "Won't Fix", color: "text-gray-600 bg-gray-50 border-gray-200", icon: XCircle },
};

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [openCount, setOpenCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter !== "all") params.set("status", filter);

      const res = await fetch(`/api/feedback?${params}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError("Admin access required to view feedback.");
          return;
        }
        throw new Error(`Failed to fetch (${res.status})`);
      }

      const json = await res.json();
      setItems(json.data ?? []);
      setOpenCount(json.meta?.open_count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateStatus = async (id: string, status: string, devResponse?: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, dev_response: devResponse }),
      });
      if (!res.ok) throw new Error("Update failed");
      // Refresh list
      fetchFeedback();
    } catch {
      // Silently fail — the list will refresh
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Feedback Log</h1>
          {openCount > 0 && (
            <span className="rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5">
              {openCount} open
            </span>
          )}
        </div>
        <button
          onClick={fetchFeedback}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(["all", "open", "in-progress", "resolved", "wont-fix"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === s
                ? "bg-background text-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="text-center py-12 text-muted-foreground">Loading feedback...</div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No feedback items found.</p>
        </div>
      )}

      {/* Feedback list */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.open;
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors"
                >
                  <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${statusCfg.color.split(" ")[0]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{item.message}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(item.created_at)}</span>
                      <span>{item.page_route || item.page_url}</span>
                      {item.element_tag && (
                        <span className="font-mono">
                          &lt;{item.element_tag}&gt;
                          {item.element_text ? ` "${item.element_text.slice(0, 30)}"` : ""}
                        </span>
                      )}
                      {item.screenshot_base64 && (
                        <span className="text-blue-500">has screenshot</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-4 bg-muted/20">
                    {/* Screenshot */}
                    {item.screenshot_base64 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Screenshot</p>
                        <img
                          src={item.screenshot_base64}
                          alt="Feedback screenshot"
                          className="rounded-md border border-border max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setScreenshotModal(item.screenshot_base64)}
                        />
                      </div>
                    )}

                    {/* Message */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Message</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{item.message}</p>
                    </div>

                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Page: </span>
                        <span className="text-foreground">{item.page_route || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category: </span>
                        <span className="text-foreground capitalize">{item.category}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Element: </span>
                        <span className="text-foreground font-mono">
                          {item.element_tag ? `<${item.element_tag}>` : "—"}
                          {item.element_id ? ` #${item.element_id}` : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Session: </span>
                        <span className="text-foreground font-mono">
                          {item.session_id?.slice(0, 8) ?? "—"}
                        </span>
                      </div>
                      {item.clerk_user_id && (
                        <div>
                          <span className="text-muted-foreground">User: </span>
                          <span className="text-foreground font-mono">
                            {item.clerk_user_id.slice(0, 12)}
                          </span>
                        </div>
                      )}
                      {item.browser_info && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Browser: </span>
                          <span className="text-foreground">
                            {(item.browser_info.screenWidth as number) ?? "?"}x
                            {(item.browser_info.screenHeight as number) ?? "?"}
                            {" — "}
                            {String(item.browser_info.language ?? "")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Context logs count */}
                    {item.context_logs && item.context_logs.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.context_logs.length} recent events captured with this report
                      </p>
                    )}

                    {/* Dev response */}
                    {item.dev_response && (
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Dev Response</p>
                        <p className="text-sm text-foreground">{item.dev_response}</p>
                      </div>
                    )}

                    {/* Page link */}
                    <a
                      href={item.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Open page <ExternalLink className="h-3 w-3" />
                    </a>

                    {/* Status actions */}
                    {item.status !== "resolved" && item.status !== "wont-fix" && (
                      <div className="flex gap-2 pt-2 border-t border-border">
                        {item.status === "open" && (
                          <button
                            onClick={() => updateStatus(item.id, "in-progress")}
                            className="text-xs px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            Mark In Progress
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(item.id, "resolved", "Fixed")}
                          className="text-xs px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, "wont-fix")}
                          className="text-xs px-3 py-1.5 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          Won&apos;t Fix
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot modal */}
      {screenshotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 cursor-pointer"
          onClick={() => setScreenshotModal(null)}
        >
          <img
            src={screenshotModal}
            alt="Feedback screenshot (full)"
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
