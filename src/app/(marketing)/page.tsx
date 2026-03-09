import Link from "next/link";
import {
  BookOpen,
  Zap,
  ShoppingBag,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const features = [
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

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              K
            </div>
            <span className="text-lg font-semibold">Know24</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Turn Your Expertise Into a{" "}
            <span className="text-primary">Knowledge Business</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            From raw expertise to a fully operational knowledge business in
            under one hour. AI-powered product generation, branded storefronts,
            and marketing automation — all for $99/month.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3 text-base font-medium text-foreground hover:bg-accent"
            >
              View Pricing
            </Link>
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
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="relative rounded-xl border border-border bg-card p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div className="absolute -top-3 left-6 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
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

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Ready to Monetize Your Knowledge?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of experts who have turned their expertise into
            thriving knowledge businesses with Know24.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Know24. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
