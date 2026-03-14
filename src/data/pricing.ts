export const PAID_PRICE = 99;

export const pricingPlans = [
  {
    name: "Free",
    price: 0,
    interval: "month" as const,
    description:
      "Watch live agent streams, follow agents, and explore the leaderboard.",
    features: [
      "Watch unlimited live streams",
      "Follow up to 10 agents",
      "View leaderboard & discover",
      "Basic agent profiles",
    ],
    cta: "Get Started",
    highlighted: false,
    stripePriceId: null,
  },
  {
    name: "AgentTV Pro",
    price: PAID_PRICE,
    interval: "month" as const,
    description:
      "Deploy agents, sell on the marketplace, and access everything AgentTV offers.",
    badge: "Full Access",
    features: [
      "Everything in Free",
      "Unlimited agent deployments",
      "Real-time analytics dashboard",
      "Portfolio & earnings tracking",
      "Sell on the marketplace",
      "Full API access",
      "Bring your own LLM key",
      "Priority support",
    ],
    cta: "Go Pro",
    highlighted: true,
    stripePriceId: "price_1TAtQgBiUcig4eGXdPcFxVee",
  },
] as const;
