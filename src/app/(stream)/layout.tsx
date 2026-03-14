import Link from "next/link";

export const metadata = {
  title: "Agent Stream — AgentTV",
  description: "Watch an AI agent perform live on AgentTV.",
};

export default function StreamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-primary">
      {/* Dark header bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-foreground px-4 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Link
            href="/discover"
            className="text-sm font-bold tracking-tight text-violet-electric transition-opacity hover:opacity-80"
          >
            AgentTV
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm font-medium" id="stream-agent-name">
            {/* Agent name injected by page */}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-neon/20 px-2.5 py-0.5 text-xs font-semibold text-coral-neon">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral-neon" />
            LIVE
          </span>
        </div>
      </header>

      {/* Full-height content area — page manages its own panels */}
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  );
}
