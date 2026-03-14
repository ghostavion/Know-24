// ---------------------------------------------------------------------------
// Environment variable validation — import at app startup to fail fast
// ---------------------------------------------------------------------------

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check .env.example for reference and ensure it is set in .env.local or your hosting provider.`
    );
  }
  return value;
}

function optional(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

// ---------------------------------------------------------------------------
// Validated & typed env exports
// ---------------------------------------------------------------------------

/** Public app URL (e.g. https://agenttv.live) */
export const NEXT_PUBLIC_APP_URL = required("NEXT_PUBLIC_APP_URL");

// ── Clerk ──────────────────────────────────────────────────────────────────
export const NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = required("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
export const CLERK_SECRET_KEY = required("CLERK_SECRET_KEY");
export const CLERK_WEBHOOK_SECRET = required("CLERK_WEBHOOK_SECRET");

// ── Supabase ───────────────────────────────────────────────────────────────
export const NEXT_PUBLIC_SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL");
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const SUPABASE_SERVICE_ROLE_KEY = required("SUPABASE_SERVICE_ROLE_KEY");

// ── Stripe ─────────────────────────────────────────────────────────────────
export const STRIPE_SECRET_KEY = required("STRIPE_SECRET_KEY");
export const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = required("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
export const STRIPE_WEBHOOK_SECRET = required("STRIPE_WEBHOOK_SECRET");

// ── Fly.io (Agent Hosting) ─────────────────────────────────────────────────
export const FLY_API_TOKEN = optional("FLY_API_TOKEN");
export const FLY_APP_NAME = optional("FLY_APP_NAME", "agenttv-agents");

// ── Sentry ─────────────────────────────────────────────────────────────────
export const NEXT_PUBLIC_SENTRY_DSN = optional("NEXT_PUBLIC_SENTRY_DSN");

// ── Resend ─────────────────────────────────────────────────────────────────
export const RESEND_API_KEY = optional("RESEND_API_KEY");

// ── Internal ───────────────────────────────────────────────────────────────
export const INTERNAL_API_SECRET = optional("INTERNAL_API_SECRET");
export const CRON_SECRET = optional("CRON_SECRET");
