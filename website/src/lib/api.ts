import type { Product, Category, ApiResponse, PaginatedResponse, Customer, Order } from "@/types";

interface AuthResult {
  token: string;
  customer: Customer;
}

interface CartResult {
  id: number;
  items: Array<{
    id: number;
    productId: number;
    product: Product;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  total: number;
  itemCount: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  // Products
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
    stockThreshold?: string;
  }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.categoryId) searchParams.set("categoryId", String(params.categoryId));
    if (params?.subcategoryId) searchParams.set("subcategoryId", String(params.subcategoryId));
    if (params?.subcategoryIds?.length) searchParams.set("subcategoryIds", params.subcategoryIds.join(","));
    if (params?.subcategoryName) searchParams.set("subcategoryName", params.subcategoryName);
    if (params?.itemTypeId) searchParams.set("itemTypeId", String(params.itemTypeId));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.isPopular) searchParams.set("isPopular", "true");
    if (params?.isBestSale) searchParams.set("isBestSale", "true");
    if (params?.discounted) searchParams.set("discounted", "true");
    if (params?.badge) searchParams.set("badge", params.badge);
    if (params?.brand) searchParams.set("brand", params.brand);
    if (params?.minRating) searchParams.set("minRating", String(params.minRating));
    if (params?.inStock) searchParams.set("inStock", "true");
    if (params?.stockThreshold) searchParams.set("stockThreshold", params.stockThreshold);

    const qs = searchParams.toString();
    return this.fetch<PaginatedResponse<Product>>(`/store/products${qs ? `?${qs}` : ""}`);
  }

  async getSubcategories(categoryId?: number): Promise<{ id: number; name: string; nameAr: string; categoryId: number; productCount: number }[]> {
    const qs = categoryId ? `?categoryId=${categoryId}` : "";
    const data = await this.fetch<ApiResponse<{ id: number; name: string; nameAr: string; categoryId: number; productCount: number }[]>>(`/store/subcategories${qs}`);
    return data.data;
  }

  async getItemTypes(subcategoryId?: number): Promise<{ id: number; name: string; nameAr: string; subcategoryId: number; productCount: number }[]> {
    const qs = subcategoryId ? `?subcategoryId=${subcategoryId}` : "";
    const data = await this.fetch<ApiResponse<{ id: number; name: string; nameAr: string; subcategoryId: number; productCount: number }[]>>(`/store/item-types${qs}`);
    return data.data;
  }

  async getBrands(categoryId?: number): Promise<{ name: string; productCount: number }[]> {
    const qs = categoryId ? `?categoryId=${categoryId}` : "";
    const data = await this.fetch<ApiResponse<{ name: string; productCount: number }[]>>(`/store/brands${qs}`);
    return data.data;
  }

  async getProduct(slug: string): Promise<ApiResponse<Product>> {
    return this.fetch<ApiResponse<Product>>(`/store/products/${slug}`);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const data = await this.fetch<PaginatedResponse<Product>>("/store/products/featured");
    return data.data;
  }

  async getBestSellingProducts(): Promise<Product[]> {
    const data = await this.fetch<PaginatedResponse<Product>>("/store/products/best-selling");
    return data.data;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const data = await this.fetch<ApiResponse<Category[]>>("/store/categories");
    return data.data;
  }

  // Customer Auth
  async login(credentials: { email: string; password: string }): Promise<ApiResponse<AuthResult>> {
    return this.fetch("/store/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(data: { name: string; phone: string; password: string }): Promise<ApiResponse<AuthResult>> {
    return this.fetch("/store/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Cart
  async getCart(token: string): Promise<ApiResponse<CartResult>> {
    return this.fetch("/store/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async addToCart(token: string, productId: number, quantity: number): Promise<ApiResponse<CartResult>> {
    return this.fetch("/store/cart", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(token: string, cartItemId: number, quantity: number): Promise<ApiResponse<CartResult>> {
    return this.fetch(`/store/cart/${cartItemId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(token: string, cartItemId: number): Promise<ApiResponse<CartResult>> {
    return this.fetch(`/store/cart/${cartItemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async clearBackendCart(token: string): Promise<ApiResponse<CartResult>> {
    return this.fetch("/store/cart", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Orders
  async createOrder(data: {
    customerName: string;
    customerPhone: string;
    city: string;
    shippingAddress: string;
    paymentMethod: string;
    notes?: string;
    deliveryZoneId?: number;
    items: Array<{ productId: number; qty: number; unitPrice: number }>;
  }): Promise<ApiResponse<Order>> {
    return this.fetch("/store/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getOrders(token: string): Promise<ApiResponse<Order[]>> {
    return this.fetch("/store/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
