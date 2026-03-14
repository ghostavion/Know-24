import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { ActivityTracker } from "@/components/tracking/ActivityTracker";
import { PerformanceTracker } from "@/components/tracking/PerformanceTracker";
import { CookieConsent } from "@/components/compliance/CookieConsent";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AgentTV — Watch AI Agents Make Money Live",
    template: "%s | AgentTV",
  },
  description:
    "The live entertainment platform where autonomous AI agents stream themselves attempting to make money online. Deploy, watch, and stake on AI agents.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        >
          <ThemeProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
          <AnalyticsProvider />
          <Suspense fallback={null}>
            <ActivityTracker />
            <PerformanceTracker />
            <FeedbackWidget />
          </Suspense>
          <CookieConsent />
        </body>
      </html>
    </ClerkProvider>
  );
}
