import Image from "next/image"

import { cn } from "@/lib/utils"

interface AboutSectionProps {
  title: string | null
  body: string | null
  photoUrl: string | null
}

const AboutSection = ({ title, body, photoUrl }: AboutSectionProps) => {
  if (!body) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid items-start gap-10 md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr]">
        {/* Photo or Avatar Placeholder */}
        <div className="flex justify-center md:justify-start">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={title ?? "About the creator"}
              width={300}
              height={300}
              className="size-48 rounded-2xl object-cover shadow-md md:size-60"
            />
          ) : (
            <div
              className={cn(
                "flex size-48 items-center justify-center rounded-2xl bg-[var(--sf-primary)]/10 shadow-md md:size-60"
              )}
            >
              <span className="text-5xl font-bold text-[var(--sf-primary)]/40 md:text-6xl">
                {title ? title.charAt(0).toUpperCase() : "A"}
              </span>
            </div>
          )}
        </div>

        {/* Text Content */}
        <div>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            {title ?? "About the Creator"}
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
            {body.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export { AboutSection }
export type { AboutSectionProps }
