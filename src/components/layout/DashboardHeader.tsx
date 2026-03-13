"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Coins } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/research": "Niche Research",
  "/ebooks": "My Ebooks",
  "/scout": "Scout",
  "/credits": "Credits",
  "/referrals": "Referrals & Account",
  "/settings": "Settings",
  "/activity": "AI Advisor",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.balance != null) setCredits(json.data.balance);
      })
      .catch(() => {});
  }, [pathname]);

  // Find title — check exact match first, then prefix match for /ebooks/[id]
  const title =
    pageTitles[pathname] ??
    (pathname.startsWith("/ebooks/") ? "Ebook Details" : "Know24");

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        {credits !== null && (
          <Link
            href="/credits"
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Coins className="size-4" />
            {credits}
          </Link>
        )}
        <UserButton />
      </div>
    </header>
  );
}
