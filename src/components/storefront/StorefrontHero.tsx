"use client"

import { cn } from "@/lib/utils"

interface StorefrontHeroProps {
  title: string | null
  tagline: string | null
  credibility: string | null
  ctaPrimary: string
  ctaSecondary: string | null
  accentColor: string
}

const StorefrontHero = ({
  title,
  tagline,
  credibility,
  ctaPrimary,
  ctaSecondary,
}: StorefrontHeroProps) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section
      className={cn(
        "bg-gradient-to-b from-[var(--sf-primary)]/10 to-transparent",
        "px-6 py-12 text-center md:py-20"
      )}
    >
      <div className="mx-auto max-w-3xl">
        {title && (
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {title}
          </h1>
        )}

        {tagline && (
          <p className="mt-6 text-lg text-muted-foreground">
            {tagline}
          </p>
        )}

        {credibility && (
          <p className="mt-4 text-sm italic text-muted-foreground/70">
            {credibility}
          </p>
        )}

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => scrollTo("products")}
            className={cn(
              "rounded-lg bg-[var(--sf-accent)] px-8 py-3 text-sm font-semibold text-white",
              "transition-colors hover:opacity-90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2"
            )}
          >
            {ctaPrimary}
          </button>

          {ctaSecondary && (
            <button
              type="button"
              onClick={() => scrollTo("lead-magnet")}
              className={cn(
                "rounded-lg border border-[var(--sf-accent)] px-8 py-3 text-sm font-semibold text-[var(--sf-accent)]",
                "transition-colors hover:bg-[var(--sf-accent)]/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2"
              )}
            >
              {ctaSecondary}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export { StorefrontHero }
export type { StorefrontHeroProps }
