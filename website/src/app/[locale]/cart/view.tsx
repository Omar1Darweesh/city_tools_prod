"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/cart/cart-context";
import { EmptyState } from "@/components/shared/empty-state";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";

export default function CartPage() {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCart();
  const [mounted, setMounted] = useState(false);
  const [taxRate, setTaxRate] = useState(15);

  useEffect(() => {
    setMounted(true);
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    fetch(`${base}/settings/platforms/ONLINE_STORE`)
      .then((r) => r.json().catch(() => null))
      .then((res) => {
        if (res) setTaxRate(Number(res.taxRate) || 15);
        else setTaxRate(15);
      })
      .catch(() => setTaxRate(15));
  }, []);

  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  if (!mounted) {
    return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="animate-pulse h-8 w-48 bg-muted rounded mb-8" /></div>;
  }

  const categoryGradients: Record<number, string> = {
    1: "from-orange-400 to-rose-500",
    2: "from-emerald-400 to-teal-500",
    3: "from-yellow-400 to-amber-500",
    4: "from-cyan-400 to-blue-500",
    5: "from-red-400 to-rose-500",
    6: "from-violet-400 to-purple-500",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="size-16" />}
          title={t("empty")}
          description={t("emptyDesc")}
          actionLabel={t("startShopping")}
          actionHref="/products"
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Cart Items */}
          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const gradient = categoryGradients[item.product.categoryId] || "from-primary to-primary/60";
              return (
                <Card key={item.product.id} className="overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {item.product.image ? (
                      <img src={item.product.image} alt="" className="size-24 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className={`size-24 shrink-0 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="size-10">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{locale === "ar" ? item.product.nameAr : item.product.nameEn}</h3>
                          <p className="text-sm text-muted-foreground">{item.product.price} {locale === "ar" ? "ج.م" : "EGP"}</p>
                        </div>
                        <div className="text-end">
                          <p className="font-bold">{item.product.price * item.quantity} {locale === "ar" ? "ج.م" : "EGP"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center rounded-full border">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="size-4" />
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  {locale === "ar" ? "ملخص الطلب" : "Order Summary"}
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("subtotal")} ({itemCount} {locale === "ar" ? "قطعة" : "items"})</span>
                    <span>{subtotal} {locale === "ar" ? "ج.م" : "EGP"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("shipping")}</span>
                    <span className="text-muted-foreground text-xs italic">
                      {locale === "ar" ? "سيتم احتسابها" : "Calculated at checkout"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("tax")} ({taxRate}%)</span>
                    <span>{tax.toFixed(2)} {locale === "ar" ? "ج.م" : "EGP"}</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t("total")}</span>
                  <span>{total.toFixed(2)} {locale === "ar" ? "ج.م" : "EGP"}</span>
                </div>
                <Button className="mt-6 w-full rounded-full" size="lg" asChild>
                  <Link href="/checkout">{t("checkout")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
