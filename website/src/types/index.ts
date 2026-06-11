export interface Product {
  id: number;
  code: string;
  barcode: string;
  nameEn: string;
  nameAr: string;
  categoryId: number;
  category?: Category;
  brand: string;
  unit: string;
  cost: number;
  priceRetail: number;
  priceWholesale: number;
  minQty: number;
  maxQty: number;
  active: boolean;
  image?: string;
  images?: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  nameAr: string;
  slug?: string;
  color?: string;
  icon?: string;
  defaultRetailMargin?: number;
  defaultWholesaleMargin?: number;
  subcategories?: Subcategory[];
  products?: Product[];
}

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  nameAr: string;
  defaultRetailMargin?: number;
  defaultWholesaleMargin?: number;
  itemTypes?: ItemType[];
}

export interface ItemType {
  id: number;
  subcategoryId: number;
  name: string;
  nameAr: string;
  defaultRetailMargin?: number;
  defaultWholesaleMargin?: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  type: "RETAIL" | "WHOLESALE";
  address?: string;
  taxNumber?: string;
  createdAt: string;
}

export interface CartItem {
  id: number;
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
}

export interface Order {
  id: number;
  invoiceNo?: string;
  customerId?: number;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: "PAID" | "PARTIAL" | "UNPAID";
  paymentMethod: "CASH" | "CARD" | "TRANSFER";
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
