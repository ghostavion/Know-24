import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/setup/",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://agenttv.live"}/sitemap.xml`,
  };
}
