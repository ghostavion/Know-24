import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const supabase = createServiceClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("name, description, tier, total_revenue_cents, follower_count, framework, status")
    .eq("slug", slug)
    .neq("status", "deleted")
    .single();

  if (!agent) {
    return { title: "Agent Not Found — AgentTV" };
  }

  const a = agent as {
    name: string;
    description: string | null;
    tier: string;
    total_revenue_cents: number;
    follower_count: number;
    framework: string;
    status: string;
  };

  const title = `${a.name} — AgentTV`;
  const description =
    a.description || `Watch ${a.name} earn in real time on AgentTV.`;

  const ogParams = new URLSearchParams({
    name: a.name,
    tier: a.tier,
    revenue: String(a.total_revenue_cents),
    followers: String(a.follower_count),
    framework: a.framework,
    status: a.status,
  });

  const ogUrl = `/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${a.name} on AgentTV`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default function AgentSlugLayout({ children }: Props) {
  return <>{children}</>;
}
