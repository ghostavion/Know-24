"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSessionId } from "@/lib/tracking/session";
import { getRecentEvents } from "@/lib/tracking/event-buffer";

interface ElementInfo {
  tag: string;
  text: string;
  id: string;
  className: string;
}

type Category = "bug" | "ux" | "feature" | "general";
type Severity = "low" | "medium" | "high" | "critical";
type SubmitState = "idle" | "submitting" | "success" | "error";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "ux", label: "UX Issue" },
  { value: "feature", label: "Feature Request" },
  { value: "general", label: "General" },
];

const SEVERITIES: { value: Severity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function FeedbackWidget() {
  // Context menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [elementInfo, setElementInfo] = useState<ElementInfo | null>(null);
  const [category, setCategory] = useState<Category>("general");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Ref to the last right-click event for re-dispatching default menu
  const lastContextEvent = useRef<MouseEvent | null>(null);
  const suppressNextContext = useRef(false);

  // ------ Context menu interception ------

  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (suppressNextContext.current) {
      suppressNextContext.current = false;
      return; // Let the native menu through
    }

    e.preventDefault();

    const target = e.target as HTMLElement | null;
    if (target) {
      setElementInfo({
        tag: target.tagName.toLowerCase(),
        text: (target.innerText || "").slice(0, 120),
        id: target.id || "",
        className:
          typeof target.className === "string"
            ? target.className.slice(0, 200)
            : "",
      });
    }

    // Position the menu, clamping to viewport
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 90);
    setMenuPos({ x, y });
    setMenuOpen(true);
    lastContextEvent.current = e;
  }, []);

  // Dismiss context menu on click outside or Escape
  useEffect(() => {
    if (!menuOpen) return;

    const dismiss = () => setMenuOpen(false);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };

    document.addEventListener("click", dismiss);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", dismiss);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  // Register the contextmenu listener
  useEffect(() => {
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [handleContextMenu]);

  // ------ Actions ------

  const openModal = () => {
    setMenuOpen(false);
    setCategory("general");
    setSeverity("medium");
    setMessage("");
    setSubmitState("idle");
    setErrorMsg("");
    setModalOpen(true);
  };

  const showDefaultMenu = () => {
    setMenuOpen(false);
    if (lastContextEvent.current) {
      suppressNextContext.current = true;
      const orig = lastContextEvent.current;
      const target = orig.target as HTMLElement;
      if (target) {
        target.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: orig.clientX,
            clientY: orig.clientY,
            screenX: orig.screenX,
            screenY: orig.screenY,
            button: 2,
          })
        );
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // Dismiss modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [modalOpen]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitState("submitting");
    setErrorMsg("");

    const contextLogs = getRecentEvents(50);
    const browserInfo = {
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      language: navigator.language,
      url: window.location.href,
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          category,
          severity,
          page_url: window.location.href,
          page_route: window.location.pathname,
          element_tag: elementInfo?.tag ?? null,
          element_text: elementInfo?.text ?? null,
          element_id: elementInfo?.id ?? null,
          element_class: elementInfo?.className ?? null,
          session_id: getSessionId(),
          context_logs: contextLogs,
          browser_info: browserInfo,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setSubmitState("success");
      setTimeout(() => {
        setModalOpen(false);
        setSubmitState("idle");
      }, 1500);
    } catch (err) {
      setSubmitState("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to submit feedback"
      );
    }
  };

  return (
    <>
      {/* Custom context menu */}
      {menuOpen && (
        <div
          className="fixed z-50"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-[160px]">
            <button
              type="button"
              onClick={openModal}
              className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Report Issue
            </button>
            <div className="border-t border-border" />
            <button
              type="button"
              onClick={showDefaultMenu}
              className="w-full px-3 py-2 text-sm text-left text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
              Default Menu
            </button>
          </div>
        </div>
      )}

      {/* Feedback modal overlay */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-200">
            {submitState === "success" ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-3">&#10003;</div>
                <p className="text-lg font-medium text-foreground">
                  Issue reported!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Thanks for your feedback.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Report Issue
                </h2>

                {/* Element info */}
                {elementInfo && (
                  <div className="text-xs bg-muted rounded-md px-3 py-2 mb-4 text-muted-foreground font-mono truncate">
                    Reporting on: &lt;{elementInfo.tag}&gt;
                    {elementInfo.text
                      ? ` '${elementInfo.text.slice(0, 60)}'`
                      : ""}
                  </div>
                )}

                {/* Current URL */}
                <div className="text-xs text-muted-foreground mb-4 truncate">
                  Page: {typeof window !== "undefined" ? window.location.href : ""}
                </div>

                {/* Category & Severity row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as Category)
                      }
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Severity
                    </label>
                    <select
                      value={severity}
                      onChange={(e) =>
                        setSeverity(e.target.value as Severity)
                      }
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what happened..."
                  rows={4}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-ring"
                />

                {/* Error message */}
                {submitState === "error" && (
                  <p className="text-sm text-destructive mb-3">{errorMsg}</p>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitState === "submitting"}
                    className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      !message.trim() || submitState === "submitting"
                    }
                    className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitState === "submitting"
                      ? "Submitting..."
                      : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
