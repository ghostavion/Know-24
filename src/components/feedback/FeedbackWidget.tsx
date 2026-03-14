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

type SubmitState = "idle" | "capturing" | "submitting" | "success" | "error";

export function FeedbackWidget() {
  // Context menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [elementInfo, setElementInfo] = useState<ElementInfo | null>(null);
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const screenshotDataRef = useRef<string | null>(null);

  // Ref to the last right-click event for re-dispatching default menu
  const lastContextEvent = useRef<MouseEvent | null>(null);
  const suppressNextContext = useRef(false);

  // ------ Screenshot capture ------
  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        scale: 0.5, // Half resolution to keep size reasonable
        ignoreElements: (el) => {
          // Don't capture the feedback widget itself
          return el.id === "feedback-widget-root";
        },
      });
      return canvas.toDataURL("image/webp", 0.7);
    } catch (err) {
      console.warn("[FeedbackWidget] Screenshot capture failed:", err);
      return null;
    }
  }, []);

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

  const openModal = async () => {
    setMenuOpen(false);
    setMessage("");
    setSubmitState("capturing");
    setErrorMsg("");
    setScreenshotUrl(null);
    screenshotDataRef.current = null;
    setModalOpen(true);

    // Capture screenshot immediately when modal opens (before it renders over the page)
    const dataUrl = await captureScreenshot();
    screenshotDataRef.current = dataUrl;
    setScreenshotUrl(dataUrl);
    setSubmitState("idle");
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
    // Clean up object URL if we created one
    if (screenshotUrl) {
      setScreenshotUrl(null);
      screenshotDataRef.current = null;
    }
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
          category: "general",
          severity: "medium",
          page_url: window.location.href,
          page_route: window.location.pathname,
          element_tag: elementInfo?.tag ?? null,
          element_text: elementInfo?.text ?? null,
          element_id: elementInfo?.id ?? null,
          element_class: elementInfo?.className ?? null,
          session_id: getSessionId(),
          context_logs: contextLogs,
          browser_info: browserInfo,
          screenshot_base64: screenshotDataRef.current ?? null,
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
    <div id="feedback-widget-root">
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

                {/* Screenshot preview */}
                {submitState === "capturing" && (
                  <div className="mb-4 rounded-md border border-border bg-muted flex items-center justify-center h-32">
                    <p className="text-xs text-muted-foreground animate-pulse">
                      Capturing screenshot...
                    </p>
                  </div>
                )}
                {screenshotUrl && submitState !== "capturing" && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Screenshot captured
                    </p>
                    <img
                      src={screenshotUrl}
                      alt="Page screenshot"
                      className="w-full rounded-md border border-border max-h-40 object-cover object-top"
                    />
                  </div>
                )}

                {/* Message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what happened..."
                  rows={4}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
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
                      !message.trim() ||
                      submitState === "submitting" ||
                      submitState === "capturing"
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
    </div>
  );
}
