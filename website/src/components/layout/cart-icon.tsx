"use client";

import { CartSheet } from "@/components/cart/cart-sheet";
import { useLocale } from "next-intl";

export function CartIcon() {
  const locale = useLocale();
  return <CartSheet locale={locale} />;
}
