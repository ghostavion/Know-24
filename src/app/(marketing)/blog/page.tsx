import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Know24",
  description:
    "Insights, guides, and strategies for building a successful knowledge business.",
};

const posts = [
  {
    slug: "the-rise-of-knowledge-businesses",
    title: "The Rise of Knowledge Businesses",
    excerpt:
      "The creator economy is evolving. Experts are packaging their know-how into digital products and building sustainable businesses — here's why it's happening now.",
    date: "2026-02-20",
    readTime: "6 min read",
  },
  {
    slug: "5-ways-ai-is-changing-how-experts-monetize",
    title: "5 Ways AI Is Changing How Experts Monetize",
    excerpt:
      "From automated product generation to intelligent market scanning, AI is removing the barriers between expertise and revenue. These five shifts are redefining the game.",
    date: "2026-02-27",
    readTime: "8 min read",
  },
  {
    slug: "from-expert-to-entrepreneur",
    title: "From Expert to Entrepreneur: A Step-by-Step Guide",
    excerpt:
      "You have the knowledge. Now what? This practical guide walks you through validating your niche, packaging your expertise, and landing your first paying customer.",
    date: "2026-03-05",
    readTime: "10 min read",
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Page Header */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Know24 Blog
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Insights, guides, and strategies for building a successful knowledge
          business.
        </p>
      </section>

      {/* Post Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-[#0891b2]/40"
            >
              <p className="text-xs text-muted-foreground">{post.date}</p>
              <h2 className="mt-2 text-lg font-semibold text-foreground group-hover:text-[#0891b2]">
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
