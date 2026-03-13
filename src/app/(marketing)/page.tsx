import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  Zap,
  ArrowRight,
  Star,
  Check,
  Search,
  TrendingUp,
  Sparkles,
  Clock,
  FileText,
  Image as ImageIcon,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { testimonials } from "@/data/testimonials";
import { pricingPlans, FOUNDER_SLOTS_TOTAL } from "@/data/pricing";

export const metadata: Metadata = {
  title: "Know24 — AI-Powered Ebook Creation & Publishing",
  description:
    "Research a niche, generate a professional ebook, and publish it to your storefront — all powered by AI. From idea to income in minutes.",
};

const steps = [
  {
    icon: Search,
    title: "Research Your Niche",
    description:
      "Enter any topic. AI analyzes the market, finds gaps, and delivers a Proof Card with your ideal ebook recommendation.",
  },
  {
    icon: BookOpen,
    title: "Generate Your Ebook",
    description:
      "One click generates a full ebook — outline, chapters, polish pass, and professional cover art. Ready in minutes.",
  },
  {
    icon: DollarSign,
    title: "Publish & Sell",
    description:
      "Set your price, publish to your storefront, and start earning. PDF download, Stripe payments, everything handled.",
  },
];

const features = [
  {
    icon: Search,
    title: "AI Niche Research",
    description:
      "Deep market analysis with confidence scoring. See what's selling, what gaps exist, and exactly what to write.",
  },
  {
    icon: FileText,
    title: "Full Ebook Generation",
    description:
      "AI outlines, drafts, and polishes every chapter. Multi-model pipeline: Gemini for speed, Claude for quality.",
  },
  {
    icon: ImageIcon,
    title: "AI Cover Art",
    description:
      "Generate professional covers in 5 styles — minimalist, bold, photographic, illustrated, gradient. Pick your favorite.",
  },
  {
    icon: Sparkles,
    title: "Chapter-Level Editing",
    description:
      "Edit any chapter inline or let AI rewrite it. Full creative control with AI assistance on demand.",
  },
  {
    icon: TrendingUp,
    title: "Scout Opportunities",
    description:
      "AI scans platforms to find trending topics and underserved niches before they're saturated.",
  },
  {
    icon: Clock,
    title: "Idea to Income in Minutes",
    description:
      "Research, generate, edit, publish — the entire workflow from concept to sellable product, compressed into minutes.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-[#0891b2]/10 px-4 py-1.5 text-sm font-medium text-[#0891b2]">
            Limited: {FOUNDER_SLOTS_TOTAL} Founder Spots at $79/mo
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Create & Sell Ebooks{" "}
            <span className="text-[#0891b2]">Powered by AI</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Research a niche, generate a professional ebook, and publish it to
            your storefront — all in minutes. No writing experience needed.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-8 py-3 text-base font-medium text-white",
                "bg-[#0891b2] hover:bg-[#0e7490]"
              )}
            >
              Claim Your Founder Spot
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3 text-base font-medium text-foreground hover:bg-accent"
            >
              View Pricing
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#0891b2]" />
              <span>Research to published: ~10 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#0891b2]" />
              <span>200 AI credits per month</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-[#0891b2]" />
              <span>Gemini + Claude AI pipeline</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Three steps from idea to published ebook. AI handles everything in
            between.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-xl border border-border bg-card p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
                  <step.icon className="size-5" />
                </div>
                <div className="absolute -top-3 left-6 flex size-6 items-center justify-center rounded-full bg-[#0891b2] text-xs font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Everything You Need to Create & Sell Ebooks
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            A complete AI-powered pipeline from market research to published,
            sellable ebook.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Loved by Creators
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            See how creators are using AI to research, write, and sell ebooks.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-[#0891b2] text-[#0891b2]"
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Simple Pricing. Lock In Founder Rates.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            One plan, full access. First 100 members get founder pricing locked
            in forever.
          </p>
          <div className="mx-auto mt-16 grid max-w-4xl gap-8 lg:grid-cols-2">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-xl border bg-card p-8",
                  plan.highlighted
                    ? "border-[#0891b2] ring-2 ring-[#0891b2]/20"
                    : "border-border"
                )}
              >
                {plan.highlighted && "badge" in plan && (
                  <span className="mb-4 inline-block rounded-full bg-[#0891b2]/10 px-3 py-1 text-xs font-semibold text-[#0891b2]">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-xl font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground">
                    /{plan.interval}
                  </span>
                  {"originalPrice" in plan && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${plan.originalPrice}
                    </span>
                  )}
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-[#0891b2]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={cn(
                    "mt-8 block w-full rounded-lg py-3 text-center text-sm font-medium",
                    plan.highlighted
                      ? "bg-[#0891b2] text-white hover:bg-[#0e7490]"
                      : "border border-border text-foreground hover:bg-accent"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#0891b2] py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            Your Next Ebook Is One Click Away
          </h2>
          <p className="mt-4 text-white/80">
            Research a niche, let AI write your ebook, publish it, and start
            earning. Founder spots are limited.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-base font-medium text-[#0891b2] hover:bg-white/90"
          >
            Claim Your Founder Spot
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
