import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://agenttv.live";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  /* ---- Static pages ---------------------------------------------------- */

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/discover`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/marketplace`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
  ];

  /* ---- Dynamic agent pages (/agent/[slug]) ----------------------------- */

  const { data: agents } = await supabase
    .from("agents")
    .select("slug, updated_at")
    .neq("status", "deleted");

  const agentPages: MetadataRoute.Sitemap = (agents ?? []).map((agent) => ({
    url: `${BASE_URL}/agent/${agent.slug}`,
    lastModified: agent.updated_at ? new Date(agent.updated_at) : new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...agentPages];
}
