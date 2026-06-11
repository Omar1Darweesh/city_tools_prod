"use client";

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";

interface CartProduct {
  id: number;
  nameEn: string;
  nameAr: string;
  price: number;
  image?: string;
  categoryId: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; product: CartProduct; quantity?: number }
  | { type: "REMOVE_ITEM"; productId: number }
  | { type: "UPDATE_QUANTITY"; productId: number; quantity: number }
  | { type: "CLEAR_CART" };

interface CartContextType {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + (action.quantity ?? 1) }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: action.quantity ?? 1 }] };
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.product.id !== action.productId) };
    case "UPDATE_QUANTITY":
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.product.id !== action.productId) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("city-tools-cart");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return { items: [] };
  });

  useEffect(() => {
    const persist = (data: CartState) => {
      localStorage.setItem("city-tools-cart", JSON.stringify(data));
    };
    try {
      persist(state);
    } catch {
      try {
        const light = {
          items: state.items.map((i) => ({
            product: { id: i.product.id, nameEn: i.product.nameEn, nameAr: i.product.nameAr, price: i.product.price, categoryId: i.product.categoryId },
            quantity: i.quantity,
          })),
        };
        persist(light);
      } catch {
        try { localStorage.removeItem("city-tools-cart"); } catch {}
      }
    }
  }, [state]);

  const addItem = (product: CartProduct, quantity?: number) =>
    dispatch({ type: "ADD_ITEM", product, quantity });

  const removeItem = (productId: number) =>
    dispatch({ type: "REMOVE_ITEM", productId });

  const updateQuantity = (productId: number, quantity: number) =>
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity });

  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
