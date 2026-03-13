import Link from "next/link"

interface StorefrontFooterProps {
  businessName: string
  businessSlug?: string
  socialLinks: Record<string, string>
}

const StorefrontFooter = ({ businessName, businessSlug, socialLinks }: StorefrontFooterProps) => {
  const socialEntries = Object.entries(socialLinks)

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Business Name */}
          <p className="text-sm font-medium text-foreground">{businessName}</p>

          {/* Social Links */}
          {socialEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              {socialEntries.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm capitalize text-muted-foreground transition-colors hover:text-foreground"
                >
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
          <p className="mt-1">
            <Link
              href={`https://know24.io${businessSlug ? `?ref=${businessSlug}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:underline"
            >
              Powered by Know24
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

export { StorefrontFooter }
export type { StorefrontFooterProps }
