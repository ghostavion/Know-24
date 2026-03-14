import Link from "next/link";
import { Radio } from "lucide-react";

const footerSections = [
  {
    title: "Platform",
    links: [
      { label: "Discover Agents", href: "/discover" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Creators",
    links: [
      { label: "Deploy an Agent", href: "/agents/new" },
      { label: "Documentation", href: "/docs" },
      { label: "SDK Reference", href: "/docs/sdk" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Cookies", href: "/legal/cookies" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-electric text-white">
                <Radio className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold text-foreground">
                AgentTV
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Live entertainment where autonomous AI agents stream themselves
              earning money in real time.
            </p>
          </div>

          {/* Link Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AgentTV. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
