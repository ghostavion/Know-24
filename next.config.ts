import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "*.r2.cloudflarestorage.com" },
      { hostname: "img.clerk.com" },
    ],
  },
  serverExternalPackages: ["@supabase/supabase-js"],
};

export default nextConfig;
