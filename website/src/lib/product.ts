export type DisplayProduct = {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  priceRetail: number;
  priceWholesale: number;
  discountPrice: number | null;
  categoryId: number;
  brand: string;
  description: string;
  images: string[];
  rating: number;
  inStock: boolean;
  stock: number;
  badge: string | null;
  isPopular: boolean;
  isBestSale: boolean;
  unit: string;
  minQty: number;
  createdAt: string;
  itemTypeId?: number;
  itemType?: { name: string; nameAr: string };
  subcategory?: { name: string; nameAr: string };
  category?: { name: string; nameAr: string; slug?: string };
};

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:3021/api";

/** Normalize product.images from API/Prisma (array, JSON string, or single URL). */
export function parseProductImages(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return [];
    if (text.startsWith("[")) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
        }
      } catch {
        /* single URL below */
      }
    }
    if (text.includes("||")) {
      return text.split("||").map((s) => s.trim()).filter(Boolean);
    }
    return [text];
  }
  return [];
}

export function normalizeProduct(raw: unknown): DisplayProduct | null {
  const p = raw as Record<string, unknown> | null;
  if (!p || !p.id || !p.nameEn) return null;

  return {
    id: Number(p.id),
    code: String(p.code || ""),
    nameEn: String(p.nameEn),
    nameAr: String(p.nameAr || p.nameEn),
    priceRetail: Number(p.priceRetail),
    priceWholesale: Number(p.priceWholesale),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
    categoryId: Number(p.categoryId),
    brand: String(p.brand || ""),
    description: String(p.description || ""),
    images: parseProductImages(p.images),
    rating: Number(p.rating || 0),
    inStock: Boolean(p.inStock ?? ((p.availableStock ?? p.stock ?? 0) as number) > 0),
    stock: Number(p.availableStock ?? p.stock ?? 0),
    badge: (p.badge as string) || null,
    isPopular: Boolean(p.isPopular),
    isBestSale: Boolean(p.isBestSale),
    unit: String(p.unit || "PCS"),
    minQty: Number(p.minQty || 1),
    createdAt: String(p.createdAt || ""),
    itemTypeId: p.itemTypeId ? Number(p.itemTypeId) : undefined,
    itemType: p.itemType
      ? {
          name: String((p.itemType as { name: string }).name),
          nameAr: String((p.itemType as { nameAr?: string }).nameAr || (p.itemType as { name: string }).name),
        }
      : undefined,
    subcategory: p.subcategory
      ? {
          name: String((p.subcategory as { name: string }).name),
          nameAr: String((p.subcategory as { nameAr?: string }).nameAr || (p.subcategory as { name: string }).name),
        }
      : undefined,
    category: p.category
      ? {
          name: String((p.category as { name: string }).name),
          nameAr: String((p.category as { nameAr?: string }).nameAr || (p.category as { name: string }).name),
          slug: (p.category as { slug?: string }).slug,
        }
      : undefined,
  };
}

export async function fetchStoreProduct(slug: string): Promise<DisplayProduct | null> {
  try {
    const res = await fetch(`${API_BASE}/store/products/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return normalizeProduct(json.data || json);
  } catch {
    return null;
  }
}
