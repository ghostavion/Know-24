import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Service-role client — bypasses RLS.
 * ONLY use in webhooks, admin routes, and server-side operations
 * that need cross-tenant access (e.g. resolving Clerk IDs to internal UUIDs).
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    }
  );
}

/**
 * Authenticated client — uses the Clerk session JWT so Supabase RLS
 * policies can enforce row-level access based on the authenticated user.
 *
 * Falls back to the anon key when no session token is available (e.g.
 * unauthenticated public routes), which means RLS will deny writes
 * unless the policy explicitly allows anon access.
 */
export async function createAuthenticatedClient() {
  const { getToken } = await auth();

  // Clerk's getToken with the "supabase" template returns a JWT that
  // Supabase can verify using the shared JWT secret configured in the
  // Supabase dashboard under Authentication > JWT Settings.
  const supabaseAccessToken = await getToken({ template: "supabase" });

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          ...(supabaseAccessToken
            ? { Authorization: `Bearer ${supabaseAccessToken}` }
            : {}),
        },
      },
      auth: { persistSession: false },
    }
  );
}
