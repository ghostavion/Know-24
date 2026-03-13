import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { pricingPlans, creditCosts, FOUNDER_SLOTS_TOTAL } from "@/data/pricing";

export const metadata: Metadata = {
  title: "Pricing — Know24",
  description:
    "Simple pricing for AI-powered ebook creation. Founder spots limited to 100 at $79/mo.",
};

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Full access to AI research, ebook generation, cover art, and
          publishing. First {FOUNDER_SLOTS_TOTAL} members lock in founder
          pricing forever.
        </p>
      </section>

      {/* Plans */}
      <section className="pb-24">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 lg:grid-cols-2">
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
              <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">
                  ${plan.price}
                </span>
                <span className="text-muted-foreground">/{plan.interval}</span>
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
      </section>

      {/* Credit Costs */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-2xl font-bold text-foreground">
            Credit Costs
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Every plan includes 200 credits per month. Here&apos;s what each
            action costs:
          </p>
          <div className="mt-8 overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-foreground">
                    Action
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-foreground">
                    Credits
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.values(creditCosts).map((item) => (
                  <tr key={item.label} className="border-b last:border-0">
                    <td className="px-6 py-3 text-muted-foreground">
                      {item.label}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-foreground">
                      {item.cost > 0 ? item.cost : `+${Math.abs(item.cost)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Questions? We&apos;ve got answers.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Both plans include the same features. Founder pricing is permanently
            locked at $79/mo for the first {FOUNDER_SLOTS_TOTAL} members. No
            hidden fees. Cancel anytime.
          </p>
          <Link
            href="/help"
            className="mt-6 inline-block text-sm font-medium text-[#0891b2] hover:text-[#0e7490]"
          >
            Visit our Help Center &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
