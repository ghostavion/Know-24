import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AIDisclosure } from "@/components/compliance/AIDisclosure";

const posts: Record<
  string,
  { title: string; date: string; author: string; readTime: string; body: string }
> = {
  "the-rise-of-knowledge-businesses": {
    title: "The Rise of Knowledge Businesses",
    date: "2026-02-20",
    author: "Know24 Team",
    readTime: "6 min read",
    body: `The creator economy is evolving. What started as influencers selling sponsorships has matured into something far more sustainable: knowledge businesses.

Experts in every field — nursing, fitness, nutrition, finance, software engineering — are discovering that their years of hard-won expertise can be packaged into digital products and sold to eager audiences around the world.

Why now? Three forces are converging:

First, the tools have caught up. Platforms like Know24 make it possible to go from raw expertise to a fully operational storefront in under an hour, with AI handling product generation, content creation, and marketing.

Second, buyer behavior has shifted. People increasingly prefer to learn from practitioners — real experts who have done the work — rather than traditional institutions. A nurse with 20 years of leadership experience can teach management skills that no MBA program covers.

Third, the economics work. With near-zero marginal costs and global distribution, a single digital product can generate revenue for years. No inventory, no shipping, no overhead.

The result? A new generation of entrepreneur-experts who are building real businesses around what they know. And the movement is just getting started.`,
  },
  "5-ways-ai-is-changing-how-experts-monetize": {
    title: "5 Ways AI Is Changing How Experts Monetize",
    date: "2026-02-27",
    author: "Know24 Team",
    readTime: "8 min read",
    body: `Artificial intelligence isn't just a buzzword — it's fundamentally changing how experts turn their knowledge into income. Here are five ways AI is reshaping the landscape.

1. Automated Product Creation

The biggest barrier to launching a knowledge business has always been the work of creating products. Writing an ebook, building a course, designing worksheets — it takes weeks or months. AI can now generate complete, polished products from your raw expertise in minutes. You provide the knowledge; AI handles the formatting, structure, and design.

2. Intelligent Content Marketing

Marketing is the second biggest barrier. AI can now generate hundreds of social media posts, blog articles, and email sequences that sound authentically like you. Platforms like Know24 generate 300 social posts per month, automatically tailored to each platform's format and audience.

3. Market Intelligence at Scale

AI agents like Scout can monitor thousands of conversations across Reddit, X, LinkedIn, Quora, podcasts, and news sources — finding the exact moments where your expertise is needed. No human could scan this much territory manually.

4. Personalized Learning Experiences

AI-powered chatbots and Expert Engines can deliver your knowledge conversationally, adapting to each learner's questions and pace. This creates a premium product tier that was previously impossible without your direct involvement.

5. Data-Driven Iteration

AI analytics can identify which products resonate, which marketing messages convert, and which topics are trending in your niche — helping you iterate faster and smarter than ever before.

The experts who embrace these tools now will have a significant head start. The question isn't whether AI will transform knowledge businesses — it's whether you'll be early or late to the shift.`,
  },
  "from-expert-to-entrepreneur": {
    title: "From Expert to Entrepreneur: A Step-by-Step Guide",
    date: "2026-03-05",
    author: "Know24 Team",
    readTime: "10 min read",
    body: `You have deep expertise in your field. You've spent years — maybe decades — mastering your craft. But how do you turn that knowledge into a business? Here's a practical, step-by-step guide.

Step 1: Validate Your Niche

Before building anything, confirm that people will pay for what you know. Look for signals: Are people asking questions in your area on Reddit, Quora, or LinkedIn? Are there existing courses or books on the topic (competition is validation)? Can you identify a specific audience who needs your expertise?

Step 2: Choose Your Knowledge Sources

Gather the raw material for your products. This might include documents you've already written, presentations, blog posts, research notes, or even just your experience. With platforms like Know24, you can upload files, paste URLs, or let an AI interview you to extract your knowledge.

Step 3: Select Your Product Mix

Not all knowledge products are created equal. Consider starting with a mix of price points: a free or low-cost lead magnet (cheat sheet, checklist), a mid-range product (guide, email course), and a premium offering (full course, chatbot, Expert Engine). This creates a natural sales funnel.

Step 4: Build Your Storefront

Your storefront is your business's home. It needs to clearly communicate who you are, what you offer, and why someone should buy from you. Focus on a compelling headline, social proof, and clear calls to action. Keep it simple — you can always iterate.

Step 5: Launch Your Marketing Engine

Content marketing is the lifeblood of a knowledge business. Start with the platforms where your audience already hangs out. Use AI to generate social posts and blog content consistently. Build an email list from day one — it's your most valuable asset.

Step 6: Iterate and Grow

Your first products won't be perfect, and that's fine. Pay attention to what sells, what questions customers ask, and what topics generate engagement. Use these signals to create new products and refine existing ones.

The beauty of a knowledge business is that it compounds. Every piece of content you create, every product you launch, and every customer you serve builds your authority and reach. Start today — your future self will thank you.`,
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) {
    return { title: "Post Not Found — Know24" };
  }
  return {
    title: `${post.title} — Know24 Blog`,
    description: post.body.slice(0, 160),
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts[slug];

  if (!post) {
    notFound();
  }

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-24">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <header className="mt-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{post.author}</span>
            <span>&middot;</span>
            <span>{post.date}</span>
            <span>&middot;</span>
            <span>{post.readTime}</span>
          </div>

          <AIDisclosure className="mt-3" />
        </header>

        <div className="mt-12 space-y-6">
          {post.body.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-base leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </>
  );
}
