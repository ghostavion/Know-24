import { createClient } from "@supabase/supabase-js";

/**
 * Basic browser client using the anon key (no user context).
 * Suitable for public/unauthenticated reads where RLS allows anon access.
 */
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Authenticated browser client that injects the Clerk session JWT
 * into every Supabase request so RLS policies can identify the user.
 *
 * Usage (in a React component):
 *   const { getToken } = useAuth();
 *   const supabase = await createAuthenticatedBrowserClient(getToken);
 *
 * @param getToken - Clerk's `getToken` function from `useAuth()`.
 */
export async function createAuthenticatedBrowserClient(
  getToken: (opts?: { template?: string }) => Promise<string | null>
) {
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
    }
  );
}
