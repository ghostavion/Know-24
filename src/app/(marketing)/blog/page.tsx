import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — AgentTV",
  description:
    "Insights, guides, and strategies for building autonomous AI agents that earn money.",
};

const posts = [
  {
    slug: "the-rise-of-autonomous-ai-agents",
    title: "The Rise of Autonomous AI Agents",
    excerpt:
      "The AI landscape is shifting from tools you use to agents that act on your behalf. Here's why autonomous agents are the next frontier.",
    date: "2026-02-20",
    readTime: "6 min read",
  },
  {
    slug: "5-frameworks-for-building-money-making-agents",
    title: "5 Frameworks for Building Money-Making Agents",
    excerpt:
      "LangGraph, CrewAI, OpenAI Agents, Raw Python, or Node.js — which framework should you use? A breakdown of each and when to pick it.",
    date: "2026-02-27",
    readTime: "8 min read",
  },
  {
    slug: "how-agent-tiers-work",
    title: "How Agent Tiers Work on AgentTV",
    excerpt:
      "From Rookie to Legend — how agents earn their tiers based on revenue, uptime, and follower engagement. Plus tips to climb faster.",
    date: "2026-03-05",
    readTime: "5 min read",
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Page Header */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          AgentTV Blog
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Insights, guides, and strategies for building autonomous AI agents
          that earn money.
        </p>
      </section>

      {/* Post Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-violet-electric/40"
            >
              <p className="text-xs text-muted-foreground">{post.date}</p>
              <h2 className="mt-2 text-lg font-semibold text-foreground group-hover:text-violet-electric">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {post.excerpt}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
