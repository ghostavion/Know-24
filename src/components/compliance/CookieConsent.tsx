"use client";

import { useState, useEffect, useCallback } from "react";

const CONSENT_KEY = "know24_cookie_consent";

type ConsentStatus = "accepted" | "rejected" | null;

function getStoredConsent(): ConsentStatus {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

/**
 * Returns true if the user has accepted analytics cookies.
 * Can be imported by other modules to gate analytics calls.
 */
export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === "accepted";
}

/**
 * Cookie consent banner that blocks PostHog analytics until the user
 * explicitly accepts. Compliant with GDPR requirements:
 * - No analytics scripts fire before consent
 * - Users can accept or reject
 * - Choice is persisted in localStorage
 * - Banner only shows when no prior choice exists
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no consent decision has been made
    const consent = getStoredConsent();
    if (consent === null) {
      setVisible(true);
    }
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
    window.dispatchEvent(new CustomEvent("cookie-consent-changed"));
  }, []);

  const handleReject = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setVisible(false);
    window.dispatchEvent(new CustomEvent("cookie-consent-changed"));
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-gray-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:border-gray-700 dark:bg-gray-900 sm:p-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            We value your privacy
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            We use cookies to improve your experience and analyze site usage. By
            accepting, you consent to the use of analytics cookies. You can
            reject non-essential cookies and still use the site.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={handleReject}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#0891b2" }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
