import { createServiceClient } from "@/lib/supabase/server";

interface PublishedStorefront {
  id: string;
  business_id: string;
}

export async function getPublishedStorefront(
  slug: string
): Promise<PublishedStorefront | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("storefronts")
    .select("id, business_id")
    .eq("subdomain", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;
  return data as PublishedStorefront;
}
