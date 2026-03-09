import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/setup/", "/activity/", "/settings/"],
      },
    ],
    sitemap: "https://know24.io/sitemap.xml",
  };
}
