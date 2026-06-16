const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

/** Default social share image — Next.js opengraph-image route (1200×630). */
export const DEFAULT_OG_IMAGE = `${BASE_URL}/opengraph-image`;

export const DEFAULT_OG_IMAGE_META = {
  url: DEFAULT_OG_IMAGE,
  width: 1200,
  height: 630,
  alt: "City Tools | سيتي تولز",
} as const;
