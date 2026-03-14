const COOKIE_NAME = "atv_session";
const SESSION_TTL_DAYS = 30;

/**
 * Generate a UUID v4 using the crypto API.
 */
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Read a cookie value by name.
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Set a cookie with the given name, value, and expiry in days.
 */
function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

/**
 * Get or create a persistent session ID stored in a cookie.
 * The session ID persists for 30 days.
 */
export function getSessionId(): string {
  let sessionId = getCookie(COOKIE_NAME);
  if (!sessionId) {
    sessionId = generateId();
    setCookie(COOKIE_NAME, sessionId, SESSION_TTL_DAYS);
  }
  return sessionId;
}
