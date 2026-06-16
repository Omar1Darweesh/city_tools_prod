import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/assets/**" },
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "city-tools.lamarpos.cloud",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "citytools.org",
        pathname: "/uploads/**",
      },
    ],
  },
  allowedDevOrigins: ["192.168.1.50", "192.168.6.140"],
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/opengraph-image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Backend API
      { source: "/backend", destination: "http://localhost:5000/api/" },
      { source: "/backend/:path*", destination: "http://localhost:5000/api/:path*" },
      { source: "/:locale/backend", destination: "http://localhost:5000/api/" },
      { source: "/:locale/backend/:path*", destination: "http://localhost:5000/api/:path*" },

      // Backoffice SPA
      { source: "/backoffice", destination: "http://localhost:5174/backoffice/" },
      { source: "/backoffice/:path*", destination: "http://localhost:5174/backoffice/:path*" },
      { source: "/:locale/backoffice", destination: "http://localhost:5174/backoffice/" },
      { source: "/:locale/backoffice/:path*", destination: "http://localhost:5174/backoffice/:path*" },

      // POS Client SPA
      { source: "/pos-client", destination: "http://localhost:5173/pos-client/" },
      { source: "/pos-client/:path*", destination: "http://localhost:5173/pos-client/:path*" },
      { source: "/:locale/pos-client", destination: "http://localhost:5173/pos-client/" },
      { source: "/:locale/pos-client/:path*", destination: "http://localhost:5173/pos-client/:path*" },
    ];
  },
};

export default withNextIntl(nextConfig);
