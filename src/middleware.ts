import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/discover(.*)",
  "/leaderboard(.*)",
  "/marketplace(.*)",
  "/agent/(.*)",
  "/api/stripe/webhook",
  "/api/health",
  "/api/agents",
  "/api/agents/(.*)/events",
  "/api/agents/(.*)/stats",
  "/api/events/ingest",
  "/api/runs/(.*)",
  "/api/leaderboard",
  "/api/marketplace",
  "/api/og",
  "/legal/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
