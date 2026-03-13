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

/** Public app URL (e.g. https://know24.io) */
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

// ── AI Providers ───────────────────────────────────────────────────────────
export const GOOGLE_GENERATIVE_AI_API_KEY = required("GOOGLE_GENERATIVE_AI_API_KEY");
export const ANTHROPIC_API_KEY = required("ANTHROPIC_API_KEY");

// ── Sentry ─────────────────────────────────────────────────────────────────
export const NEXT_PUBLIC_SENTRY_DSN = optional("NEXT_PUBLIC_SENTRY_DSN");

// ── Resend ─────────────────────────────────────────────────────────────────
export const RESEND_API_KEY = required("RESEND_API_KEY");

// ── Internal ───────────────────────────────────────────────────────────────
export const INTERNAL_API_SECRET = optional("INTERNAL_API_SECRET");
export const CRON_SECRET = optional("CRON_SECRET");

// ── Deep Research (optional add-ons) ───────────────────────────────────────
export const FIRECRAWL_API_KEY = optional("FIRECRAWL_API_KEY");
export const TAVILY_API_KEY = optional("TAVILY_API_KEY");
