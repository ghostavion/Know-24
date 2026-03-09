"use client";

import { UserButton } from "@clerk/nextjs";

export function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          My Businesses
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <UserButton />
      </div>
    </header>
  );
}
