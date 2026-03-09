import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  Zap,
  ShoppingBag,
  BarChart3,
  ArrowRight,
  Star,
  Users,
  Globe,
  Sparkles,
  Shield,
  Clock,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { testimonials } from "@/data/testimonials";
import { pricingPlans } from "@/data/pricing";

export const metadata: Metadata = {
  title: "Know24 — Turn Your Expertise Into a Business",
};

const steps = [
  {
    icon: BookOpen,
    title: "Upload Your Knowledge",
    description:
      "Paste URLs, upload documents, or let our AI interview you. We extract and organize your expertise automatically.",
  },
  {
    icon: Zap,
    title: "AI Builds Your Products",
    description:
      "Choose from 12 product types — guides, courses, chatbots, and more. Our AI generates complete, sellable products from your knowledge.",
  },
  {
    icon: ShoppingBag,
    title: "Launch Your Storefront",
    description:
      "A beautiful, branded storefront goes live instantly. Accept payments via Stripe. No coding required.",
  },
  {
    icon: BarChart3,
    title: "Grow with AI Marketing",
    description:
      "AI-powered blog posts, social content, email sequences, and Scout intelligence find your audience and drive sales.",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "AI Product Generation",
    description:
      "Create ebooks, courses, chatbots, quizzes, and more from your raw expertise. AI does the heavy lifting.",
  },
  {
    icon: Globe,
    title: "Branded Storefront",
    description:
      "A beautiful, conversion-optimized storefront with custom domain support. Live in minutes.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track sales, visitors, and engagement in real-time. Understand what content drives revenue.",
  },
  {
    icon: Shield,
    title: "Stripe Connect Payments",
    description:
      "Get paid directly to your bank account. Secure, PCI-compliant payments with zero hassle.",
  },
  {
    icon: Users,
    title: "AI Marketing Suite",
    description:
      "300 social posts/month, blog engine with auto-publish, and email sequences — all AI-generated.",
  },
  {
    icon: Clock,
    title: "Scout Intelligence",
    description:
      "AI scans Reddit, X, LinkedIn, and more to find opportunities where your expertise is needed.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Turn Your Expertise Into a{" "}
            <span className="text-[#0891b2]">Knowledge Business</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            From raw expertise to a fully operational knowledge business in
            under one hour. AI-powered product generation, branded storefronts,
            and marketing automation — all for $99/month.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-8 py-3 text-base font-medium text-white",
                "bg-[#0891b2] hover:bg-[#0e7490]"
              )}
            >
              Start Building Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3 text-base font-medium text-foreground hover:bg-accent"
            >
              View Pricing
            </Link>
          </div>
          {/* Social Proof Bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0891b2]" />
              <span>2,500+ knowledge businesses launched</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#0891b2]" />
              <span>4.9/5 average rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0891b2]" />
              <span>Launch in under 1 hour</span>
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
            Four steps to go from expert to entrepreneur. Our AI handles the
            heavy lifting.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-xl border border-border bg-card p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="absolute -top-3 left-6 flex h-6 w-6 items-center justify-center rounded-full bg-[#0891b2] text-xs font-bold text-white">
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
            Everything You Need to Succeed
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            A complete platform for building, launching, and growing your
            knowledge business.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
                  <feature.icon className="h-5 w-5" />
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
            Loved by Experts Everywhere
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            See how knowledge professionals are transforming their expertise
            into thriving businesses.
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
                      className="h-4 w-4 fill-[#0891b2] text-[#0891b2]"
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
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            One plan to run your business. One add-on to supercharge growth.
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
                {plan.highlighted && (
                  <span className="mb-4 inline-block rounded-full bg-[#0891b2]/10 px-3 py-1 text-xs font-semibold text-[#0891b2]">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0891b2]" />
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
            Ready to Monetize Your Knowledge?
          </h2>
          <p className="mt-4 text-white/80">
            Join thousands of experts who have turned their expertise into
            thriving knowledge businesses with Know24.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-base font-medium text-[#0891b2] hover:bg-white/90"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
