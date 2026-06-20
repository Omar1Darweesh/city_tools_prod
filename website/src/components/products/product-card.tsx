"use client";

import type { MockProduct } from "@/data";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/cart-context";
import ProductImage from "@/components/products/product-image";
import { productDetailPath } from "@/lib/product-url";
import { ShoppingCart, Star, Check } from "lucide-react";
import { useState } from "react";

export function ProductCard({ product, locale }: { product: MockProduct; locale: string }) {
  const price = product.discountPrice ?? product.priceRetail;
  const gradient = "from-gray-500 to-gray-600";
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const productName = locale === "ar" ? product.nameAr || product.nameEn : product.nameEn;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price,
      categoryId: product.categoryId,
      image: product.images?.[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:shadow-sm">
      <Link href={productDetailPath(product)} className="block shrink-0">
        <div className="relative aspect-[3/2] overflow-hidden">
          {product.images?.[0] ? (
            <ProductImage src={product.images[0]} alt={productName} fill className="object-cover" sizes="(max-width: 640px) 50vw, 200px" loading="lazy" />
          ) : null}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${product.images?.[0] ? "opacity-60" : ""}`} />
          {!product.images?.[0] && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="size-5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            </div>
          )}
          {product.badge && (
            <Badge
              variant={product.badge === "SALE" ? "destructive" : "default"}
              className="absolute top-1 start-1 rounded-full px-1.5 py-0 text-[9px] font-bold leading-4"
            >
              {product.badge === "SALE" ? (locale === "ar" ? "تخفيض" : "SALE") : locale === "ar" ? "جديد" : "NEW"}
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-2">
        <div className="flex flex-1 flex-col">
          <Link href={productDetailPath(product)} className="block">
            <p className="truncate text-[9px] text-muted-foreground">{product.brand || "\u00A0"}</p>
            <h3 className="mt-0.5 min-h-[2rem] line-clamp-2 text-[11px] font-medium leading-tight transition-colors group-hover:text-primary">
              {productName}
            </h3>
          </Link>

          <div className="mt-0.5 flex h-3.5 items-center gap-px">
            {product.rating > 0 ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-2 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                  />
                ))}
                <span className="ms-px text-[8px] text-muted-foreground">{product.rating}</span>
              </>
            ) : null}
          </div>

          <div className="mt-1 flex items-baseline gap-1">
            {product.discountPrice ? (
              <>
                <span className="text-xs font-bold text-primary">{price}</span>
                <span className="text-[9px] text-muted-foreground line-through">{product.priceRetail}</span>
              </>
            ) : (
              <span className="text-xs font-bold">{price}</span>
            )}
          </div>
        </div>

        <Button
          size="sm"
          className="mt-2 h-6 w-full shrink-0 rounded-full text-[9px]"
          onClick={handleAddToCart}
          variant={added ? "secondary" : "default"}
        >
          {added ? (
            <><Check className="size-2.5" /> {locale === "ar" ? "تمت" : "Added"}</>
          ) : (
            <><ShoppingCart className="size-2.5" /> {locale === "ar" ? "أضف" : "Add"}</>
          )}
        </Button>
      </div>
    </div>
  );
}
