import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export const metadata = {
  title: "AgentTV — Browse",
  description: "Discover and watch AI agents live on AgentTV.",
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/discover" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-violet-electric">
              AgentTV
            </span>
          </Link>

          {/* Search */}
          <div className="mx-4 flex max-w-md flex-1">
            <input
              type="search"
              placeholder="Search agents..."
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-electric/40"
            />
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            <Link
              href="/leaderboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Leaderboard
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
