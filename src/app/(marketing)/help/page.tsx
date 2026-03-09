import Link from "next/link";
import type { Metadata } from "next";
import {
  Rocket,
  Package,
  Store,
  Megaphone,
  CreditCard,
  Cpu,
} from "lucide-react";
import { helpCategories } from "@/data/help-categories";

export const metadata: Metadata = {
  title: "Help Center — Know24",
  description:
    "Find answers to common questions about Know24 — from getting started to advanced features.",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Package,
  Store,
  Megaphone,
  CreditCard,
  Cpu,
};

export default function HelpPage() {
  return (
    <>
      {/* Page Header */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Help Center
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Find answers to common questions about Know24 — from getting started
          to advanced features.
        </p>
      </section>

      {/* Category Grid */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-2">
          {helpCategories.map((category) => {
            const Icon = iconMap[category.icon];
            return (
              <div
                key={category.slug}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex items-start gap-4">
                  {Icon && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-foreground">
                      {category.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {category.articles.length}{" "}
                      {(category.articles.length as number) === 1 ? "article" : "articles"}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {category.articles.slice(0, 2).map((article) => (
                        <li key={article.slug}>
                          <Link
                            href={`/help/${article.slug}`}
                            className="text-sm text-[#0891b2] hover:text-[#0e7490]"
                          >
                            {article.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
