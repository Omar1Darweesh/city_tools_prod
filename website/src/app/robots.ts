import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/en/", "/ar/", "/"],
        disallow: [
          "/admin",
          "/en/admin",
          "/ar/admin",
          "/auth",
          "/en/auth",
          "/ar/auth",
          "/api/",
          "/backend/",
          "/backoffice/",
          "/pos-client/",
          "/en/cart",
          "/ar/cart",
          "/en/checkout",
          "/ar/checkout",
          "/_next/",
          "/uploads/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
