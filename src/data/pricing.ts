export const FOUNDER_PRICE = 79;
export const STANDARD_PRICE = 99;
export const FOUNDER_SLOTS_TOTAL = 100;

export const pricingPlans = [
  {
    name: "Founder",
    price: FOUNDER_PRICE,
    originalPrice: STANDARD_PRICE,
    interval: "month" as const,
    description:
      "Lock in the lowest price forever. Limited to the first 100 members.",
    badge: "Limited — Founder Pricing",
    features: [
      "200 AI credits per month",
      "AI niche research with Proof Card",
      "Full ebook generation (outline → draft → polish)",
      "AI cover art generation (5 styles)",
      "Chapter-level AI rewriting",
      "PDF export & download",
      "Publish to your storefront",
      "Scout: AI opportunity scanning",
      "Referral rewards (50 credits each side)",
      "Priority support",
    ],
    cta: "Claim Founder Spot",
    highlighted: true,
    stripeLookupKey: "know24_founder_monthly",
  },
  {
    name: "Standard",
    price: STANDARD_PRICE,
    interval: "month" as const,
    description:
      "Everything you need to research, create, and sell ebooks with AI.",
    features: [
      "200 AI credits per month",
      "AI niche research with Proof Card",
      "Full ebook generation (outline → draft → polish)",
      "AI cover art generation (5 styles)",
      "Chapter-level AI rewriting",
      "PDF export & download",
      "Publish to your storefront",
      "Scout: AI opportunity scanning",
      "Referral rewards (50 credits each side)",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
    stripeLookupKey: "know24_standard_monthly",
  },
] as const;

export const creditCosts = {
  research: { cost: 10, label: "Niche Research" },
  ebook_generation: { cost: 50, label: "Ebook Generation" },
  cover_generation: { cost: 10, label: "Cover Art" },
  chapter_rewrite: { cost: 5, label: "Chapter Rewrite" },
  scout_scan: { cost: 15, label: "Scout Scan" },
  referral_reward: { cost: -50, label: "Referral Reward" },
} as const;
