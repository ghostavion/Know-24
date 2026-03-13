import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/blog(.*)",
  "/help(.*)",
  "/api/storefront/(.*)",
  "/api/stripe/webhook",
  "/api/health",
  "/api/referrals/track",
  "/api/checkout/verify",
  "/api/email/send-purchase",
  "/api/email/send-ebook-purchase",
  "/api/ebooks/(.*)/public",
  "/api/ebooks/(.*)/checkout",
  "/api/orders/download",
  "/ebook/(.*)",
  "/s/(.*)",
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
