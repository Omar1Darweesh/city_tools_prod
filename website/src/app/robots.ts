import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools-eg.com";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/auth", "/api"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
