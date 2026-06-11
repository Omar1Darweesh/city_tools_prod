"use client";

import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/routing";

export function CartSheet({ locale = "ar" }: { locale?: string }) {
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-9 rounded-full">
          <ShoppingCart className="size-5" />
          <Badge variant="destructive" suppressHydrationWarning className="absolute -end-2 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold data-[empty=true]:hidden" data-empty={itemCount === 0 || undefined}>
            {itemCount > 99 ? "99+" : itemCount}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side={locale === "ar" ? "left" : "right"} className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetPrimitive.Title className="sr-only">
          {locale === "ar" ? "سلة التسوق" : "Shopping Cart"}
        </SheetPrimitive.Title>
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-lg font-semibold">
            {locale === "ar" ? "سلة التسوق" : "Shopping Cart"} ({itemCount})
          </h3>
        </div>
        <Separator />
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingCart className="size-16 text-muted-foreground/20" />
            <p className="mt-4 font-medium">{locale === "ar" ? "سلتك فارغة" : "Your cart is empty"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === "ar" ? "أضف منتجات إلى سلتك" : "Add items to your cart"}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  {item.product.image ? (
                    <img src={item.product.image} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="size-16 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="size-8 text-muted-foreground/30">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {locale === "ar" ? item.product.nameAr : item.product.nameEn}
                      </p>
                      <button onClick={() => removeItem(item.product.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center rounded-full border">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold">{item.product.price * item.quantity} {locale === "ar" ? "ج.م" : "EGP"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {items.length > 0 && (
          <div className="border-t p-6">
            <div className="flex justify-between text-base font-bold mb-4">
              <span>{locale === "ar" ? "المجموع" : "Subtotal"}</span>
              <span>{subtotal} {locale === "ar" ? "ج.م" : "EGP"}</span>
            </div>
            <div className="flex gap-3">
              <SheetClose asChild>
                <Button variant="outline" className="flex-1 rounded-full" asChild>
                  <Link href="/cart">{locale === "ar" ? "عرض السلة" : "View Cart"}</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button className="flex-1 rounded-full" asChild>
                  <Link href="/checkout">{locale === "ar" ? "إتمام الطلب" : "Checkout"}</Link>
                </Button>
              </SheetClose>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
