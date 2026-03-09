import { createServiceClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { primaryModel } from "@/lib/ai/providers";

interface BusinessRow {
  id: string;
  name: string;
  niche: string;
}

// Generates and publishes a blog post for each active business
// Called by a cron endpoint or scheduled job
export async function runBlogPublisher(): Promise<{ published: number; errors: string[] }> {
  const supabase = createServiceClient();
  const errors: string[] = [];
  let published = 0;

  // Get all active businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, niche")
    .eq("status", "active")
    .eq("onboarding_completed", true);

  if (!businesses || businesses.length === 0) {
    return { published: 0, errors: [] };
  }

  for (const biz of businesses as BusinessRow[]) {
    try {
      // Check if business already has a recent post (within 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("business_id", biz.id)
        .gte("published_at", sevenDaysAgo);

      if ((count ?? 0) > 0) continue;

      // Generate a blog post
      const { text } = await generateText({
        model: primaryModel,
        system: `You are a professional blog writer for "${biz.name}", a ${biz.niche} business. Write engaging, SEO-friendly content.`,
        prompt: `Write a blog post about a topic relevant to ${biz.niche}. Format: Title on first line, blank line, then the full article in markdown. Keep it around 600-800 words. End with "META: " followed by a 160-character meta description.`,
      });

      // Parse title, body, meta
      const lines = text.split("\n");
      const title = lines[0].replace(/^#\s*/, "").trim();
      const metaLine = lines.findLast((l) => l.startsWith("META: "));
      const metaDescription = metaLine ? metaLine.replace("META: ", "").trim() : null;
      const bodyLines = lines.slice(1).filter((l) => !l.startsWith("META: "));
      const body = bodyLines.join("\n").trim();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      // Insert and publish
      const { error: insertError } = await supabase.from("blog_posts").insert({
        business_id: biz.id,
        title,
        slug: `${slug}-${Date.now()}`,
        body,
        meta_description: metaDescription,
        is_ai_generated: true,
        status: "published",
        published_at: new Date().toISOString(),
      });

      if (insertError) {
        errors.push(`${biz.name}: ${insertError.message}`);
      } else {
        published++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${biz.name}: ${msg}`);
    }
  }

  return { published, errors };
}
