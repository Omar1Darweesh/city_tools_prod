const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";
const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:3021/api";

const locales = ["en", "ar"] as const;

type ProductRow = { code: string; updatedAt: string };
type CategoryRow = { slug: string; updatedAt: string };

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeDate(value?: string): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function safePathSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

function urlEntry(
  url: string,
  lastModified: Date,
  changeFrequency: string,
  priority: number,
): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(url)}</loc>`,
    `    <lastmod>${lastModified.toISOString()}</lastmod>`,
    `    <changefreq>${changeFrequency}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchAllProducts(): Promise<ProductRow[]> {
  const all: ProductRow[] = [];
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

async function fetchAllCategories(): Promise<CategoryRow[]> {
  const json = await fetchJson<{ data?: { slug?: string; updatedAt?: string; createdAt?: string }[] }>(
    `${API_BASE}/store/categories`,
  );
  if (!json?.data) return [];
  return json.data
    .filter((c) => c.slug?.trim())
    .map((c) => ({ slug: c.slug!.trim(), updatedAt: c.updatedAt || c.createdAt || "" }));
}

function buildStaticEntries(now: Date): string[] {
  const entries: string[] = [];
  entries.push(urlEntry(BASE_URL, now, "weekly", 1.0));

  for (const locale of locales) {
    entries.push(urlEntry(`${BASE_URL}/${locale}`, now, "daily", 1.0));

    const staticPages = [
      { path: "products", changeFrequency: "daily", priority: 0.9 },
      { path: "categories", changeFrequency: "weekly", priority: 0.8 },
      { path: "support", changeFrequency: "monthly", priority: 0.5 },
    ] as const;

    for (const page of staticPages) {
      entries.push(
        urlEntry(`${BASE_URL}/${locale}/${page.path}`, now, page.changeFrequency, page.priority),
      );
    }
  }

  return entries;
}

export function buildSitemapXml(
  products: ProductRow[] = [],
  categories: CategoryRow[] = [],
): string {
  const now = new Date();
  const entries = buildStaticEntries(now);

  for (const locale of locales) {
    for (const cat of categories) {
      entries.push(
        urlEntry(
          `${BASE_URL}/${locale}/categories/${safePathSegment(cat.slug)}`,
          safeDate(cat.updatedAt),
          "weekly",
          0.7,
        ),
      );
    }

    for (const prod of products) {
      entries.push(
        urlEntry(
          `${BASE_URL}/${locale}/products/${safePathSegment(prod.code)}`,
          safeDate(prod.updatedAt),
          "weekly",
          0.65,
        ),
      );
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");
}

export async function generateSitemapXml(timeoutMs = 20000): Promise<string> {
  const dataPromise = Promise.all([fetchAllProducts(), fetchAllCategories()]);
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), timeoutMs);
  });

  const result = await Promise.race([dataPromise, timeoutPromise]);
  if (!result) {
    return buildSitemapXml([], []);
  }

  const [products, categories] = result;
  return buildSitemapXml(products, categories);
}
