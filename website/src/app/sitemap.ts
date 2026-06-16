import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";
const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:3021/api";

const locales = ["en", "ar"] as const;

function safeDate(value?: string): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function safePathSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

async function fetchJson<T>(url: string, timeoutMs = 10000): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchAllProducts(): Promise<{ code: string; updatedAt: string }[]> {
  const all: { code: string; updatedAt: string }[] = [];
  const limit = 100;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 50) {
    const json = await fetchJson<{
      data?: { code?: string; updatedAt?: string; createdAt?: string }[];
      totalPages?: number;
    }>(`${API_BASE}/store/products?page=${page}&limit=${limit}`);

    if (!json?.data?.length) break;

    for (const p of json.data) {
      if (p.code?.trim()) {
        all.push({ code: p.code.trim(), updatedAt: p.updatedAt || p.createdAt || "" });
      }
    }

    totalPages = json.totalPages ?? 1;
    page++;
  }

  return all;
}

async function fetchAllCategories(): Promise<{ slug: string; updatedAt: string }[]> {
  const json = await fetchJson<{ data?: { slug?: string; updatedAt?: string; createdAt?: string }[] }>(
    `${API_BASE}/store/categories`,
  );
  if (!json?.data) return [];
  return json.data
    .filter((c) => c.slug?.trim())
    .map((c) => ({ slug: c.slug!.trim(), updatedAt: c.updatedAt || c.createdAt || "" }));
}

function buildSitemap(products: { code: string; updatedAt: string }[], categories: { slug: string; updatedAt: string }[]): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  entries.push({ url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 });

  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    });

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

    for (const cat of categories) {
      entries.push({
        url: `${BASE_URL}/${locale}/categories/${safePathSegment(cat.slug)}`,
        lastModified: safeDate(cat.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const prod of products) {
      entries.push({
        url: `${BASE_URL}/${locale}/products/${safePathSegment(prod.code)}`,
        lastModified: safeDate(prod.updatedAt),
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [products, categories] = await Promise.all([fetchAllProducts(), fetchAllCategories()]);
    return buildSitemap(products, categories);
  } catch {
    return buildSitemap([], []);
  }
}
