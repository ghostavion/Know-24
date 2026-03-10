import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves a Clerk user ID (e.g. "user_2abc...") to the internal
 * Supabase users.id UUID. Returns null if the user is not found.
 */
export async function resolveUserId(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  return (data as { id: string } | null)?.id ?? null;
}
