import type { MockProduct, MockCategory, MockSubcategory, MockItemType, MockBrand, MockStatistic, MockDiscountCard, StockThreshold } from "./mock-data";
import { categories as mockCategories, brands as mockBrands, statistics as mockStatistics, discountCards as mockDiscountCards } from "./mock-data";
import { api } from "@/lib/api";

export type { MockProduct, MockCategory, MockSubcategory, MockItemType, MockBrand, MockStatistic, MockDiscountCard, StockThreshold };

export const categories: MockCategory[] = mockCategories;
export const brands: MockBrand[] = mockBrands;

const CACHE_TTL_MS = 5 * 60 * 1000;
let trustedBrandsCache: { data: MockBrand[]; at: number } | null = null;
let categoriesCache: { data: MockCategory[]; at: number } | null = null;

function mapProduct(p: any): MockProduct { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    id: p.id,
    code: String(p.code || "").trim(),
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    priceRetail: p.priceRetail,
    priceWholesale: p.priceWholesale,
    discountPrice: p.discountPrice ?? null,
    categoryId: p.categoryId,
    subcategoryId: p.subcategoryId ?? undefined,
    itemTypeId: p.itemTypeId ?? undefined,
    brand: p.brand,
    description: p.description || "",
    images: (() => {
      const raw = p.images;
      if (Array.isArray(raw)) return raw.filter(Boolean);
      if (typeof raw === "string" && raw.trim()) {
        if (raw.includes("||")) return raw.split("||").map((s) => s.trim()).filter(Boolean);
        if (raw.startsWith("[")) {
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [raw];
          } catch {
            return [raw];
          }
        }
        return [raw];
      }
      return [];
    })(),
    rating: p.rating || 0,
    inStock: p.inStock ?? true,
    stock: p.stock ?? (p.inStock ? 999 : 0),
    badge: p.badge || null,
    isPopular: p.isPopular ?? false,
    isBestSale: p.isBestSale ?? false,
    createdAt: p.createdAt || new Date().toISOString(),
    unit: p.unit || "PCS",
    minQty: p.minQty || 1,
  };
}

function mapCategory(c: any): MockCategory { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    slug: c.slug,
    color: c.color || "#2563eb",
    icon: c.icon || "Wrench",
    productCount: c.productCount || 0,
  };
}

export async function getCategoryBySlug(slug: string): Promise<MockCategory | undefined> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/store/categories/${slug}`);
    const json = await res.json();
    return json.data ? mapCategory(json.data) : mockCategories.find((c) => c.slug === slug);
  } catch {
    return mockCategories.find((c) => c.slug === slug);
  }
}

export const store = {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    categoryId?: number;
    subcategoryId?: number;
    subcategoryIds?: number[];
    subcategoryName?: string;
    itemTypeId?: number;
    search?: string;
    sort?: string;
    isPopular?: boolean;
    isBestSale?: boolean;
    discounted?: boolean;
    badge?: string;
    brand?: string;
    minRating?: number;
    inStock?: boolean;
    stockThreshold?: StockThreshold;
  }) {
    try {
      let res = await api.getProducts(params);
      let data = res.data.map(mapProduct);
      let total = res.total;
      if (params?.minRating) data = data.filter((p) => p.rating >= params.minRating!);
      if (params?.inStock) data = data.filter((p) => p.inStock);
      if (params?.stockThreshold === "low") data = data.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 10);
      else if (params?.stockThreshold === "moderate") data = data.filter((p) => (p.stock ?? 0) > 10 && (p.stock ?? 0) <= 50);
      else if (params?.stockThreshold === "high") data = data.filter((p) => (p.stock ?? 0) > 50);
      return { ...res, data, total };
    } catch {
      const { getProducts } = await import("./mock-data");
      return getProducts(params);
    }
  },

  async getProduct(id: number): Promise<MockProduct | undefined> {
    try {
      const res = await api.getProduct(String(id));
      return res.data ? mapProduct(res.data) : undefined;
    } catch {
      const { getProductById } = await import("./mock-data");
      return getProductById(id);
    }
  },

  async getProductByCode(code: string): Promise<MockProduct | undefined> {
    try {
      const res = await api.getProduct(code);
      return res.data ? mapProduct(res.data) : undefined;
    } catch {
      const { products } = await import("./mock-data");
      return products.find((p) => p.code === code);
    }
  },

  async getFeaturedProducts(): Promise<MockProduct[]> {
    try {
      const data = await api.getFeaturedProducts();
      return data.map(mapProduct);
    } catch {
      const { getFeaturedProducts } = await import("./mock-data");
      return getFeaturedProducts();
    }
  },

  async getBestSellingProducts(): Promise<MockProduct[]> {
    try {
      const data = await api.getBestSellingProducts();
      return data.map(mapProduct);
    } catch {
      const { getBestSellingProducts } = await import("./mock-data");
      return getBestSellingProducts();
    }
  },

  async getPopularProducts(): Promise<MockProduct[]> {
    try {
      const data = await api.getFeaturedProducts();
      return data.map(mapProduct);
    } catch {
      const { getPopularProducts } = await import("./mock-data");
      return getPopularProducts();
    }
  },

  async getProductsByCategory(categoryId: number): Promise<MockProduct[]> {
    try {
      const res = await api.getProducts({ categoryId, limit: 50 });
      return res.data.map(mapProduct);
    } catch {
      const { getProductsByCategory } = await import("./mock-data");
      return getProductsByCategory(categoryId);
    }
  },

  async getCategories(): Promise<MockCategory[]> {
    if (categoriesCache && Date.now() - categoriesCache.at < CACHE_TTL_MS) {
      return categoriesCache.data;
    }
    try {
      const res = await api.getCategories();
      const data = res.map(mapCategory);
      categoriesCache = { data, at: Date.now() };
      return data;
    } catch {
      return mockCategories;
    }
  },

  async getCategory(id: number): Promise<MockCategory | undefined> {
    try {
      const cats = await store.getCategories();
      return cats.find((c) => c.id === id);
    } catch {
      return mockCategories.find((c) => c.id === id);
    }
  },

  async getCategoryBySlug(slug: string): Promise<MockCategory | undefined> {
    return getCategoryBySlug(slug);
  },

  async getSubcategories(categoryId?: number): Promise<MockSubcategory[]> {
    try {
      return await api.getSubcategories(categoryId);
    } catch {
      const { getSubcategories } = await import("./mock-data");
      return getSubcategories(categoryId);
    }
  },

  async getItemTypes(subcategoryId?: number): Promise<MockItemType[]> {
    try {
      return await api.getItemTypes(subcategoryId);
    } catch {
      const { getItemTypes } = await import("./mock-data");
      return getItemTypes(subcategoryId);
    }
  },

  async getBrands(categoryId?: number): Promise<MockBrand[]> {
    try {
      const data = await api.getBrands(categoryId);
      return data.map((b, i) => ({
        id: i + 1,
        name: b.name,
        nameAr: b.name,
        productCount: b.productCount,
      }));
    } catch {
      return mockBrands;
    }
  },

  async searchProducts(query: string): Promise<MockProduct[]> {
    try {
      const res = await api.getProducts({ search: query, limit: 50 });
      return res.data.map(mapProduct);
    } catch {
      const { searchProducts } = await import("./mock-data");
      return searchProducts(query);
    }
  },

  async getTrustedBrands(): Promise<MockBrand[]> {
    if (trustedBrandsCache && Date.now() - trustedBrandsCache.at < CACHE_TTL_MS) {
      return trustedBrandsCache.data;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/store/brands/trusted`);
      const json = await res.json();
      const rows: MockBrand[] = (json.data || []).map((b: MockBrand) => ({
        id: b.id,
        name: b.name,
        nameAr: b.nameAr || b.name,
        productCount: b.productCount ?? 0,
        logo: b.logo || null,
        isTrusted: b.isTrusted !== false,
        sortOrder: b.sortOrder ?? 0,
      }));
      const data = rows
        .filter((b) => b.isTrusted !== false && b.productCount > 0)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || b.productCount - a.productCount);
      trustedBrandsCache = { data, at: Date.now() };
      return data;
    } catch {
      return mockBrands;
    }
  },

  async getActiveStatistics(): Promise<MockStatistic[]> {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/store/statistics/active`);
      const json = await res.json();
      return json.data || [];
    } catch {
      return mockStatistics;
    }
  },

  async getActiveDiscountCards(): Promise<MockDiscountCard[]> {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/store/discount-cards/active`);
      const json = await res.json();
      return json.data || [];
    } catch {
      return mockDiscountCards;
    }
  },

  async getTrustFeatures(): Promise<any[]> {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/store/trust-features/active`);
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async getActiveHeroSlides(): Promise<any[]> {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/store/hero-slides/active`);
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },
};
