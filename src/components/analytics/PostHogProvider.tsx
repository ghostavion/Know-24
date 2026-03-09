"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

function PostHogIdentify() {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      import("posthog-js").then(({ default: posthog }) => {
        posthog.identify(user.id, {
          email: user.emailAddresses[0]?.emailAddress,
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        });
      });
    }
  }, [user]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      import("posthog-js").then(({ default: posthog }) => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host:
            process.env.NEXT_PUBLIC_POSTHOG_HOST ||
            "https://us.i.posthog.com",
          person_profiles: "identified_only",
          capture_pageview: true,
          capture_pageleave: true,
          loaded: (ph) => {
            if (process.env.NODE_ENV === "development") ph.debug();
          },
        });
        setReady(true);
      });
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !ready) {
    return <>{children}</>;
  }

  return (
    <>
      <PostHogIdentify />
      {children}
    </>
  );
}
