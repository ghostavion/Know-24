"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import type { StorefrontTheme } from "@/lib/storefront/themes"
import { AIDisclosure } from "@/components/compliance/AIDisclosure"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ThemedStorefrontProps {
  theme: StorefrontTheme;
  business: {
    name: string;
    slug: string;
    niche: string;
  };
  product: {
    title: string;
    description: string;
    priceCents: number;
    features?: string[];
    coverImageUrl?: string;
  };
  research?: {
    trendingTopics?: { topic: string }[];
    pricingInsights?: { sweetSpot: number };
  };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatPrice = (cents: number): string => {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
};

const spacingClass = (spacing: StorefrontTheme["spacing"]): string => {
  switch (spacing) {
    case "compact":
      return "py-12 px-4";
    case "generous":
      return "py-24 px-6";
    default:
      return "py-16 px-6";
  }
};

const sectionSpacingClass = (spacing: StorefrontTheme["spacing"]): string => {
  switch (spacing) {
    case "compact":
      return "py-10 px-4";
    case "generous":
      return "py-20 px-6";
    default:
      return "py-14 px-6";
  }
};

/* -------------------------------------------------------------------------- */
/*  Section: Nav                                                               */
/* -------------------------------------------------------------------------- */

function ThemedNav({
  theme,
  businessName,
  businessSlug,
}: {
  theme: StorefrontTheme;
  businessName: string;
  businessSlug: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Product", href: "#pricing" },
    { label: "Features", href: "#features" },
    { label: "FAQ", href: "#faq" },
  ];

  const scrollTo = (hash: string) => {
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        backgroundColor: theme.colors.primary,
        color: "#ffffff",
        fontFamily: theme.typography.bodyFont,
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href={`/s/${businessSlug}`} className="flex items-center gap-3">
          <div
            className="flex size-9 items-center justify-center rounded-lg text-sm font-bold uppercase"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            {businessName.charAt(0)}
          </div>
          <span className="text-lg font-semibold">{businessName}</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => scrollTo(link.href)}
              className="text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {link.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => scrollTo("#pricing")}
            className="rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#ffffff",
              color: theme.colors.primary,
            }}
          >
            Get Started
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="border-t border-white/10 md:hidden"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <div className="space-y-1 px-6 py-4">
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Hero                                                              */
/* -------------------------------------------------------------------------- */

function ThemedHero({
  theme,
  product,
}: {
  theme: StorefrontTheme;
  product: ThemedStorefrontProps["product"];
}) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: theme.typography.headingFont,
    color: theme.heroLayout === "full-width" ? "#ffffff" : theme.colors.text,
  };

  const descriptionStyle: React.CSSProperties = {
    fontFamily: theme.typography.bodyFont,
    color: theme.heroLayout === "full-width" ? "rgba(255,255,255,0.85)" : theme.colors.textMuted,
  };

  const ctaButtonStyle: React.CSSProperties = {
    backgroundColor: theme.heroLayout === "full-width" ? theme.colors.accent : theme.colors.primary,
    color: theme.slug === "bold" ? "#0c0a09" : "#ffffff",
  };

  /* --- centered --- */
  if (theme.heroLayout === "centered") {
    return (
      <section
        className={`text-center ${spacingClass(theme.spacing)}`}
        style={{ backgroundColor: theme.colors.surface }}
      >
        <div className="mx-auto max-w-3xl">
          <h1 className={`font-bold tracking-tight ${theme.typography.heroSize}`} style={headingStyle}>
            {product.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed" style={descriptionStyle}>
            {product.description}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className={`${theme.borderRadius} px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90`}
              style={ctaButtonStyle}
            >
              Get Started — {formatPrice(product.priceCents)}
            </button>
            <button
              type="button"
              onClick={() => scrollTo("features")}
              className={`${theme.borderRadius} border px-8 py-3.5 text-sm font-semibold transition-colors hover:opacity-80`}
              style={{
                borderColor: theme.colors.primary,
                color: theme.colors.primary,
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* --- split --- */
  if (theme.heroLayout === "split") {
    return (
      <section
        className={`${spacingClass(theme.spacing)}`}
        style={{ backgroundColor: theme.colors.surface }}
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <h1 className={`font-bold tracking-tight ${theme.typography.heroSize}`} style={headingStyle}>
              {product.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed" style={descriptionStyle}>
              {product.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => scrollTo("pricing")}
                className={`${theme.borderRadius} px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90`}
                style={ctaButtonStyle}
              >
                Get Started — {formatPrice(product.priceCents)}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            {product.coverImageUrl ? (
              <div className={`relative aspect-[4/3] w-full overflow-hidden ${theme.borderRadius} ${theme.shadow}`}>
                <Image
                  src={product.coverImageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div
                className={`flex aspect-[4/3] w-full items-center justify-center ${theme.borderRadius}`}
                style={{ backgroundColor: theme.colors.primary + "15" }}
              >
                <span
                  className="text-6xl font-bold"
                  style={{ color: theme.colors.primary + "30" }}
                >
                  {product.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  /* --- full-width --- */
  if (theme.heroLayout === "full-width") {
    return (
      <section
        className={`text-center ${spacingClass(theme.spacing)}`}
        style={{ backgroundColor: theme.colors.text }}
      >
        <div className="mx-auto max-w-4xl">
          <h1
            className={`font-bold tracking-tight ${theme.typography.heroSize}`}
            style={{ ...headingStyle, color: "#ffffff" }}
          >
            {product.title}
          </h1>
          <p
            className="mt-6 text-lg leading-relaxed"
            style={{ ...descriptionStyle, color: "rgba(255,255,255,0.75)" }}
          >
            {product.description}
          </p>
          <div className="mt-10">
            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className={`${theme.borderRadius} px-10 py-4 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-90`}
              style={ctaButtonStyle}
            >
              Get Started — {formatPrice(product.priceCents)}
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* --- minimal --- */
  if (theme.heroLayout === "minimal") {
    return (
      <section
        className="px-6 py-20"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="mx-auto max-w-2xl">
          <h1 className={`font-semibold tracking-tight ${theme.typography.heroSize}`} style={headingStyle}>
            {product.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={descriptionStyle}>
            {product.description}
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className={`${theme.borderRadius} px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90`}
              style={ctaButtonStyle}
            >
              Get Started — {formatPrice(product.priceCents)}
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* --- gradient --- */
  if (theme.heroLayout === "gradient") {
    return (
      <section
        className={`text-center ${spacingClass(theme.spacing)}`}
        style={{
          background: `linear-gradient(135deg, #a855f7, ${theme.colors.primary})`,
        }}
      >
        <div className="mx-auto max-w-3xl">
          <h1
            className={`font-bold tracking-tight ${theme.typography.heroSize}`}
            style={{ fontFamily: theme.typography.headingFont, color: "#ffffff" }}
          >
            {product.title}
          </h1>
          <p
            className="mt-6 text-lg leading-relaxed"
            style={{ fontFamily: theme.typography.bodyFont, color: "rgba(255,255,255,0.9)" }}
          >
            {product.description}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className={`${theme.borderRadius} px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90`}
              style={{ backgroundColor: "#ffffff", color: theme.colors.primary }}
            >
              Get Started — {formatPrice(product.priceCents)}
            </button>
            <button
              type="button"
              onClick={() => scrollTo("features")}
              className={`${theme.borderRadius} border border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10`}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* --- card --- */
  return (
    <section
      className={`flex items-center justify-center ${spacingClass(theme.spacing)}`}
      style={{ backgroundColor: theme.colors.background }}
    >
      <div
        className={`mx-auto max-w-2xl text-center ${theme.borderRadius} ${theme.shadow} p-10 md:p-14`}
        style={{ backgroundColor: theme.colors.surface }}
      >
        <h1 className={`font-bold tracking-tight ${theme.typography.heroSize}`} style={headingStyle}>
          {product.title}
        </h1>
        <p className="mt-6 text-lg leading-relaxed" style={descriptionStyle}>
          {product.description}
        </p>
        <div className="mt-8">
          <button
            type="button"
            onClick={() => scrollTo("pricing")}
            className={`${theme.borderRadius} px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90`}
            style={ctaButtonStyle}
          >
            Get Started — {formatPrice(product.priceCents)}
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Features                                                          */
/* -------------------------------------------------------------------------- */

function ThemedFeatures({
  theme,
  features,
}: {
  theme: StorefrontTheme;
  features: string[];
}) {
  if (features.length === 0) return null;

  const icons = [
    <svg key="check" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    <svg key="star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    <svg key="zap" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    <svg key="shield" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    <svg key="target" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    <svg key="award" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
  ];

  return (
    <section
      id="features"
      className={sectionSpacingClass(theme.spacing)}
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="mx-auto max-w-6xl">
        <h2
          className={`text-center font-bold ${theme.typography.sectionSize}`}
          style={{ fontFamily: theme.typography.headingFont, color: theme.colors.text }}
        >
          What You Get
        </h2>
        <p
          className="mx-auto mt-4 max-w-2xl text-center text-base"
          style={{ color: theme.colors.textMuted, fontFamily: theme.typography.bodyFont }}
        >
          Everything included to help you succeed.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`${theme.borderRadius} ${theme.shadow} p-6`}
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div
                className="mb-4 flex size-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: theme.colors.primary + "15", color: theme.colors.primary }}
              >
                {icons[i % icons.length]}
              </div>
              <h3
                className="text-base font-semibold"
                style={{ color: theme.colors.text, fontFamily: theme.typography.headingFont }}
              >
                {feature}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Social Proof                                                      */
/* -------------------------------------------------------------------------- */

function ThemedSocialProof({ theme }: { theme: StorefrontTheme }) {
  const testimonials = [
    {
      quote: "This completely changed my approach. The quality and depth of content is outstanding.",
      name: "Alex R.",
      role: "Verified Buyer",
    },
    {
      quote: "Worth every penny. I saw results within the first week of applying what I learned.",
      name: "Jordan M.",
      role: "Verified Buyer",
    },
    {
      quote: "Clear, actionable, and well-structured. Exactly what I was looking for.",
      name: "Sam K.",
      role: "Verified Buyer",
    },
  ];

  return (
    <section
      className={sectionSpacingClass(theme.spacing)}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <div className="mx-auto max-w-6xl">
        <h2
          className={`text-center font-bold ${theme.typography.sectionSize}`}
          style={{ fontFamily: theme.typography.headingFont, color: theme.colors.text }}
        >
          What People Are Saying
        </h2>
        <div className="mx-auto mt-3 flex justify-center">
          <AIDisclosure
            label="AI-generated preview testimonials — real reviews will appear here after launch"
            variant="badge"
          />
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`${theme.borderRadius} p-6`}
              style={{
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, si) => (
                  <svg
                    key={si}
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={theme.colors.accent}
                    stroke="none"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: theme.colors.text, fontFamily: theme.typography.bodyFont }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-4">
                <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                  {t.name}
                </p>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Pricing                                                           */
/* -------------------------------------------------------------------------- */

function ThemedPricing({
  theme,
  product,
  businessSlug,
}: {
  theme: StorefrontTheme;
  product: ThemedStorefrontProps["product"];
  businessSlug: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isFree = product.priceCents === 0;

  const handleCheckout = async () => {
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      if (isFree) {
        const res = await fetch(`/api/storefront/${businessSlug}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        if (!res.ok) {
          const data: { error?: { message?: string } } = await res.json();
          throw new Error(data.error?.message ?? "Failed to process request.");
        }
        window.location.reload();
      } else {
        const res = await fetch("/api/checkout/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storefrontSlug: businessSlug,
            customerEmail: email.trim(),
          }),
        });
        if (!res.ok) {
          const data: { error?: { message?: string } } = await res.json();
          throw new Error(data.error?.message ?? "Failed to create checkout session.");
        }
        const data: { data?: { url: string } } = await res.json();
        if (data.data?.url) {
          window.location.href = data.data.url;
        } else {
          throw new Error("No checkout URL returned.");
        }
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <section
      id="pricing"
      className={sectionSpacingClass(theme.spacing)}
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="mx-auto max-w-lg">
        <h2
          className={`text-center font-bold ${theme.typography.sectionSize}`}
          style={{ fontFamily: theme.typography.headingFont, color: theme.colors.text }}
        >
          {isFree ? "Get Free Access" : "Simple Pricing"}
        </h2>
        <p
          className="mx-auto mt-3 max-w-md text-center text-base"
          style={{ color: theme.colors.textMuted, fontFamily: theme.typography.bodyFont }}
        >
          {isFree
            ? "Enter your email to get instant access."
            : "One-time purchase. Lifetime access. No subscriptions."}
        </p>

        <div
          className={`mt-10 ${theme.borderRadius} ${theme.shadow} p-8`}
          style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {/* Price */}
          <div className="text-center">
            {isFree ? (
              <span
                className="text-4xl font-bold"
                style={{ color: theme.colors.text }}
              >
                Free
              </span>
            ) : (
              <span
                className="text-5xl font-bold"
                style={{ color: theme.colors.text }}
              >
                {formatPrice(product.priceCents)}
              </span>
            )}
          </div>

          {/* Feature list */}
          {product.features && product.features.length > 0 && (
            <ul className="mt-8 space-y-3">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={theme.colors.primary}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span
                    className="text-sm"
                    style={{ color: theme.colors.text, fontFamily: theme.typography.bodyFont }}
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Email + CTA */}
          <div className="mt-8 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && email.trim()) handleCheckout();
              }}
              placeholder="you@example.com"
              disabled={status === "loading"}
              className={`w-full ${theme.borderRadius} border px-4 py-3 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50`}
              style={{
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                fontFamily: theme.typography.bodyFont,
              }}
            />
            <button
              type="button"
              onClick={handleCheckout}
              disabled={status === "loading" || !email.trim()}
              className={`w-full ${theme.borderRadius} px-6 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.slug === "bold" ? "#0c0a09" : "#ffffff",
              }}
            >
              {status === "loading"
                ? "Processing..."
                : isFree
                  ? "Get Free Access"
                  : `Buy Now — ${formatPrice(product.priceCents)}`}
            </button>
          </div>

          {status === "error" && errorMsg && (
            <p className="mt-3 text-center text-sm text-red-600">{errorMsg}</p>
          )}

          <p
            className="mt-4 text-center text-xs"
            style={{ color: theme.colors.textMuted }}
          >
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: FAQ                                                               */
/* -------------------------------------------------------------------------- */

function ThemedFAQ({
  theme,
  productTitle,
}: {
  theme: StorefrontTheme;
  productTitle: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "What do I get after purchasing?",
      a: `You will receive immediate access to "${productTitle}" via email. All content is delivered digitally.`,
    },
    {
      q: "Is there a refund policy?",
      a: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
    },
    {
      q: "How long do I have access?",
      a: "You get lifetime access. Once purchased, the content is yours to revisit anytime.",
    },
    {
      q: "Can I get support if I have questions?",
      a: "Absolutely. Reach out via the contact information in the footer and we'll be happy to help.",
    },
  ];

  return (
    <section
      id="faq"
      className={sectionSpacingClass(theme.spacing)}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <div className="mx-auto max-w-2xl">
        <h2
          className={`text-center font-bold ${theme.typography.sectionSize}`}
          style={{ fontFamily: theme.typography.headingFont, color: theme.colors.text }}
        >
          Frequently Asked Questions
        </h2>

        <div className="mt-10 space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`${theme.borderRadius} overflow-hidden`}
                style={{
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold transition-colors"
                  style={{ color: theme.colors.text, fontFamily: theme.typography.bodyFont }}
                >
                  {faq.q}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isOpen && (
                  <div
                    className="px-5 pb-4 text-sm leading-relaxed"
                    style={{ color: theme.colors.textMuted, fontFamily: theme.typography.bodyFont }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: CTA                                                               */
/* -------------------------------------------------------------------------- */

function ThemedCTA({
  theme,
  product,
}: {
  theme: StorefrontTheme;
  product: ThemedStorefrontProps["product"];
}) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className={`text-center ${sectionSpacingClass(theme.spacing)}`}
      style={{ backgroundColor: theme.colors.primary }}
    >
      <div className="mx-auto max-w-2xl">
        <h2
          className={`font-bold ${theme.typography.sectionSize}`}
          style={{ fontFamily: theme.typography.headingFont, color: "#ffffff" }}
        >
          Ready to Get Started?
        </h2>
        <p
          className="mt-4 text-base leading-relaxed"
          style={{ color: "rgba(255,255,255,0.85)", fontFamily: theme.typography.bodyFont }}
        >
          Join others who have already transformed their results with{" "}
          <span className="font-semibold">{product.title}</span>.
        </p>
        <button
          type="button"
          onClick={() => scrollTo("pricing")}
          className={`mt-8 ${theme.borderRadius} px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90`}
          style={{
            backgroundColor: "#ffffff",
            color: theme.colors.primary,
          }}
        >
          {product.priceCents === 0
            ? "Get Free Access"
            : `Get Started — ${formatPrice(product.priceCents)}`}
        </button>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Footer                                                            */
/* -------------------------------------------------------------------------- */

function ThemedFooter({
  theme,
  businessName,
  businessSlug,
}: {
  theme: StorefrontTheme;
  businessName: string;
  businessSlug: string;
}) {
  return (
    <footer
      style={{
        backgroundColor: theme.colors.surface,
        borderTop: `1px solid ${theme.colors.border}`,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <p
            className="text-sm font-medium"
            style={{ color: theme.colors.text, fontFamily: theme.typography.bodyFont }}
          >
            {businessName}
          </p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: theme.colors.textMuted }}
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: theme.colors.textMuted }}
            >
              FAQ
            </button>
          </div>
        </div>

        <div
          className="mt-8 border-t pt-6 text-center"
          style={{ borderColor: theme.colors.border }}
        >
          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
            &copy; {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
          <p className="mt-1 text-xs" style={{ color: theme.colors.textMuted }}>
            <a
              href={`https://know24.io?ref=${businessSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-70"
              style={{ color: theme.colors.textMuted }}
            >
              Powered by Know24
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section Router                                                             */
/* -------------------------------------------------------------------------- */

const SECTION_MAP: Record<
  string,
  (props: ThemedStorefrontProps) => React.ReactNode
> = {
  nav: (props) => (
    <ThemedNav
      theme={props.theme}
      businessName={props.business.name}
      businessSlug={props.business.slug}
    />
  ),
  hero: (props) => <ThemedHero theme={props.theme} product={props.product} />,
  features: (props) => (
    <ThemedFeatures theme={props.theme} features={props.product.features ?? []} />
  ),
  "social-proof": (props) => <ThemedSocialProof theme={props.theme} />,
  pricing: (props) => (
    <ThemedPricing
      theme={props.theme}
      product={props.product}
      businessSlug={props.business.slug}
    />
  ),
  faq: (props) => (
    <ThemedFAQ theme={props.theme} productTitle={props.product.title} />
  ),
  cta: (props) => <ThemedCTA theme={props.theme} product={props.product} />,
  footer: (props) => (
    <ThemedFooter
      theme={props.theme}
      businessName={props.business.name}
      businessSlug={props.business.slug}
    />
  ),
};

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

const ThemedStorefront = (props: ThemedStorefrontProps) => {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: props.theme.colors.background,
        fontFamily: props.theme.typography.bodyFont,
      }}
    >
      {props.theme.sections.map((sectionId) => {
        const renderFn = SECTION_MAP[sectionId];
        if (!renderFn) return null;
        return <div key={sectionId}>{renderFn(props)}</div>;
      })}
    </div>
  );
};

export { ThemedStorefront };
export type { ThemedStorefrontProps };
