import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";
// Use internal API URL for server-side sitemap generation (avoids nginx round-trip)
const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const locales = ["en", "ar"] as const;

async function fetchAllProducts(): Promise<{ code: string; updatedAt: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/store/products?limit=1000`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map((p: any) => ({ code: p.code, updatedAt: p.updatedAt || p.createdAt || "" }));
  } catch {
    return [];
  }
}

async function fetchAllCategories(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/store/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map((c: any) => ({ slug: c.slug, updatedAt: c.updatedAt || c.createdAt || "" }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([fetchAllProducts(), fetchAllCategories()]);

  const entries: MetadataRoute.Sitemap = [];

  // Root redirect (e.g. citytools.org → citytools.org/en)
  entries.push({ url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 });

  for (const locale of locales) {
    // Homepage
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    });

    // Static indexable pages
    const staticPages = [
      { path: "products", changeFrequency: "daily" as const, priority: 0.9 },
      { path: "categories", changeFrequency: "weekly" as const, priority: 0.8 },
      { path: "support", changeFrequency: "monthly" as const, priority: 0.5 },
    ];
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}/${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }

    // Category pages
    for (const cat of categories) {
      entries.push({
        url: `${BASE_URL}/${locale}/categories/${cat.slug}`,
        lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // Product pages
    for (const prod of products) {
      entries.push({
        url: `${BASE_URL}/${locale}/products/${prod.code}`,
        lastModified: prod.updatedAt ? new Date(prod.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }
  }

  return entries;
}
