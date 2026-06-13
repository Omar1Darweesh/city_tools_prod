/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function authFetch(endpoint: string, options?: RequestInit) {
  const token = (() => {
    if (typeof window === "undefined") return null;
    try {
      const s = localStorage.getItem("city-tools-session");
      if (s) return JSON.parse(s).token;
    } catch {}
    return null;
  })();

  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("city-tools-session");
      window.location.href = "/auth/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      errMsg = body?.message || body?.error || JSON.stringify(body) || errMsg;
    } catch {
      try { errMsg = await res.text() || errMsg; } catch {}
    }
    throw new Error(errMsg);
  }

  return res.json();
}

// Convert store-style query params to products-controller-style params
function toProductsParams(params?: string): string {
  if (!params) return "";
  const searchParams = new URLSearchParams(params);
  // Map store API param names to backend products controller names
  const map: Record<string, string> = { limit: "take", search: "search", categoryId: "categoryId" };
  const mapped = new URLSearchParams();
  for (const [k, v] of searchParams.entries()) {
    mapped.set(map[k] || k, v);
  }
  return `?${mapped.toString()}`;
}

// Normalize a product from the backend (stock → inStock, etc.)
function normalizeProduct(p: any) {
  if (!p) return p;
  return { ...p, inStock: (p.stock ?? 0) > 0 };
}

// Categories from the backend lack store-facing fields; augment them.
function mapAdminCategory(c: any) {
  const name = c.name || "";
  return {
    ...c,
    slug: c.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${c.id}`,
    color: c.color || "#2563eb",
    icon: c.icon || "Wrench",
    productCount: c._count?.products ?? 0,
  };
}

export const adminApi = {
  // ── Auth ───────────────────────────────────────────────────
  login: (email: string, password: string) =>
    authFetch("/store/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // ── Products ───────────────────────────────────────────────
  getProducts: async (params?: string) => {
    const res = await authFetch(`/products${toProductsParams(params)}`);
    return {
      ...res,
      data: (res.data || []).map(normalizeProduct),
    };
  },

  getProduct: async (id: number) => {
    const res = await authFetch(`/products/${id}`);
    return normalizeProduct(res);
  },

  createProduct: (data: any) => {
    const { inStock, ...rest } = data;
    return authFetch("/products", {
      method: "POST",
      body: JSON.stringify(rest),
    });
  },

  updateProduct: (id: number, data: any) => {
    const { inStock, ...rest } = data;
    return authFetch(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(rest),
    });
  },

  deleteProduct: (id: number) =>
    authFetch(`/products/${id}`, {
      method: "DELETE",
    }),

  // ── Categories ─────────────────────────────────────────────
  getCategories: async () => {
    const res = await authFetch("/products/categories");
    const raw = Array.isArray(res) ? res : res.data || [];
    return { data: raw.map(mapAdminCategory) };
  },

  getCategory: async (id: number) => {
    const res = await authFetch(`/products/categories/${id}`);
    return mapAdminCategory(res);
  },

  createCategory: (data: any) => {
    return authFetch("/products/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateCategory: (id: number, data: any) => {
    return authFetch(`/products/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteCategory: (id: number) =>
    authFetch(`/products/categories/${id}`, {
      method: "DELETE",
    }),

  // ── Subcategories ──────────────────────────────────────────
  getSubcategories: async (categoryId?: number) => {
    const qs = categoryId ? `?categoryId=${categoryId}` : "";
    const res = await authFetch(`/products/subcategories${qs}`);
    return { data: (Array.isArray(res) ? res : res.data || []) };
  },

  createSubcategory: (data: any) =>
    authFetch("/products/subcategories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSubcategory: (id: number, data: any) =>
    authFetch(`/products/subcategories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteSubcategory: (id: number) =>
    authFetch(`/products/subcategories/${id}`, {
      method: "DELETE",
    }),

  // ── Item Types ─────────────────────────────────────────────
  getItemTypes: async (subcategoryId?: number) => {
    const qs = subcategoryId ? `?subcategoryId=${subcategoryId}` : "";
    const res = await authFetch(`/products/item-types${qs}`);
    return { data: (Array.isArray(res) ? res : res.data || []) };
  },

  createItemType: (data: any) =>
    authFetch("/products/item-types", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateItemType: (id: number, data: any) =>
    authFetch(`/products/item-types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteItemType: (id: number) =>
    authFetch(`/products/item-types/${id}`, {
      method: "DELETE",
    }),

  // ── Orders (website online store only) ─────────────────────
  getOrders: () =>
    authFetch("/pos/sales?channel=ONLINE_STORE"),

  getOrder: (id: number) =>
    authFetch(`/pos/sales/${id}`),

  updateOrderStatus: (id: number, status: string) =>
    authFetch(`/pos/sales/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // ── Customers ──────────────────────────────────────────────
  getCustomers: () =>
    authFetch("/customers"),

  // ── Dashboard Stats ────────────────────────────────────────
  getDashboardStats: async () => {
    try {
      const [products, categories, orders] = await Promise.all([
        authFetch("/products?take=1"),
        authFetch("/products/categories"),
        authFetch("/pos/sales?channel=ONLINE_STORE"),
      ]);
      return { products, categories, orders };
    } catch {
      const [products, categories] = await Promise.all([
        authFetch("/products").catch(() => ({ total: 0 })),
        authFetch("/products/categories").catch(() => []),
      ]);
      return { products, categories, orders: { data: [] } };
    }
  },

  // ── Brands ─────────────────────────────────────────
  getBrands: () =>
    authFetch("/store/brands/trusted"),

  getBrand: async (id: string) => {
    const res = await authFetch(`/store/brands/${id}`);
    return res;
  },

  createBrand: (data: any) =>
    authFetch("/store/brands", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBrand: (id: string, data: any) =>
    authFetch(`/store/brands/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteBrand: (id: string) =>
    authFetch(`/store/brands/${id}`, {
      method: "DELETE",
    }),

  // ── Statistics (read-only via store) ─────────────────────
  getStatistics: () =>
    authFetch("/store/statistics").then((res) => ({
      data: (res.data || []).map((s: any) => ({
        ...s,
        sortOrder: s.sortOrder ?? s.sort_order ?? 0,
        isActive: s.isActive ?? s.active ?? true,
      })),
    })),

  getStatistic: async (id: number) => {
    const res = await authFetch("/store/statistics");
    const list = res.data || [];
    return { data: list.find((s: any) => s.id === id) || null };
  },

  createStatistic: (data: any) =>
    authFetch("/store/statistics", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatistic: (id: number, data: any) =>
    authFetch(`/store/statistics/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteStatistic: (id: number) =>
    authFetch(`/store/statistics/${id}`, {
      method: "DELETE",
    }),

  // ── Discount Cards (read-only via store) ─────────────────
  getDiscountCards: () =>
    authFetch("/store/discount-cards").then((res) => ({
      data: (res.data || []).map((c: any) => ({
        ...c,
        isActive: c.isActive ?? c.active ?? true,
      })),
    })),

  getDiscountCard: async (id: number) => {
    const res = await authFetch("/store/discount-cards");
    const list = res.data || [];
    return { data: list.find((c: any) => c.id === id) || null };
  },

  createDiscountCard: (data: any) =>
    authFetch("/store/discount-cards", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateDiscountCard: (id: number, data: any) =>
    authFetch(`/store/discount-cards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteDiscountCard: (id: number) =>
    authFetch(`/store/discount-cards/${id}`, {
      method: "DELETE",
    }),

  // ── Trust Features ────────────────────────────────────────
  getTrustFeatures: () =>
    authFetch("/store/trust-features").then((res) => ({
      data: (res.data || []).map((t: any) => ({
        ...t,
        isActive: t.isActive ?? t.active ?? true,
      })),
    })),

  getTrustFeature: async (id: number) => {
    const res = await authFetch("/store/trust-features");
    const list = res.data || [];
    return { data: list.find((t: any) => t.id === id) || null };
  },

  createTrustFeature: (data: any) =>
    authFetch("/store/trust-features", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTrustFeature: (id: number, data: any) =>
    authFetch(`/store/trust-features/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTrustFeature: (id: number) =>
    authFetch(`/store/trust-features/${id}`, {
      method: "DELETE",
    }),

  // ── Admin Users ───────────────────────────────────────────
  getUsers: () =>
    authFetch("/users"),

  getUser: async (id: number) => {
    const res = await authFetch("/users");
    const list = res.data || [];
    return { data: list.find((u: any) => u.id === id) || null };
  },

  createUser: (data: any) =>
    authFetch("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateUser: (id: number, data: any) =>
    authFetch(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteUser: (id: number) =>
    authFetch(`/users/${id}`, {
      method: "DELETE",
    }),

  // ── Hero Slides ──────────────────────────────────────────────
  getHeroSlides: () =>
    authFetch("/store/hero-slides").then((res) => ({
      data: (res.data || []).map((s: any) => ({
        ...s,
        isActive: s.isActive ?? s.active ?? true,
      })),
    })),

  getHeroSlide: async (id: number) => {
    const res = await authFetch("/store/hero-slides");
    const list = res.data || [];
    return { data: list.find((s: any) => s.id === id) || null };
  },

  createHeroSlide: (data: any) =>
    authFetch("/store/hero-slides", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateHeroSlide: (id: number, data: any) =>
    authFetch(`/store/hero-slides/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteHeroSlide: (id: number) =>
    authFetch(`/store/hero-slides/${id}`, {
      method: "DELETE",
    }),

  // ── Support Pages ────────────────────────────────────────
  getSupportPages: () =>
    authFetch("/store/support-pages"),

  updateSupportPages: (data: any) =>
    authFetch("/store/support-pages", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // ── Footer Settings ──────────────────────────────────────
  getFooterSettings: () =>
    authFetch("/store/footer-settings"),

  updateFooterSettings: (data: any) =>
    authFetch("/store/footer-settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // ── Web Store Settings (platform settings) ────────────────
  getWebStoreSettings: () =>
    authFetch("/settings/platforms/ONLINE_STORE"),

  updateWebStoreSettings: (data: { taxRate: number; shippingFee: number; active?: boolean; showRatings?: boolean; showDefectiveCategory?: boolean }) =>
    authFetch("/settings/platforms/ONLINE_STORE", {
      method: "PUT",
      body: JSON.stringify({ ...data, commission: 0 }),
    }),
};
