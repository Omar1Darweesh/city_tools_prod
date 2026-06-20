"use client";

import type { MockProduct } from "@/data";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import ProductImage from "@/components/products/product-image";
import { productDetailPath } from "@/lib/product-url";
import { formatPrice, normalizeRating } from "@/lib/format-price";
import { ShoppingCart, Star, Check } from "lucide-react";
import { useState } from "react";

export function ProductListItem({ product, locale }: { product: MockProduct; locale: string }) {
  const isRtl = locale === "ar";
  const price = product.discountPrice ?? product.priceRetail;
  const rating = normalizeRating(product.rating);
  const gradient = "from-gray-500 to-gray-600";
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
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
    <div className="flex gap-4 rounded-2xl border bg-card p-4 transition-all hover:shadow-md">
      <Link href={productDetailPath(product)} className="shrink-0">
        <div className="size-28 rounded-xl relative overflow-hidden">
          {product.images?.[0] ? (
            <ProductImage src={product.images[0]} alt="" fill className="object-cover" sizes="112px" />
          ) : null}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${product.images?.[0] ? "opacity-60" : ""}`} />
          {!product.images?.[0] && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="size-7">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <Link href={productDetailPath(product)} className="hover:text-primary transition-colors">
            <h3 className="font-medium line-clamp-1">{locale === "ar" ? product.nameAr : product.nameEn}</h3>
          </Link>
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`size-3 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
              ))}
            </div>
          )}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold">{formatPrice(price, locale)}</span>
            {product.discountPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.priceRetail, locale)}</span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${product.inStock ? "text-emerald-600" : "text-destructive"}`}>
            {product.inStock ? (isRtl ? "متوفر" : "In stock") : (isRtl ? "غير متوفر" : "Out of stock")}
          </p>
        </div>
        <Button
          size="sm"
          className="self-end rounded-full text-xs h-9"
          onClick={handleAddToCart}
          variant={added ? "secondary" : "default"}
        >
          {added ? (
            <><Check className="size-3.5" /> {locale === "ar" ? "تمت" : "Added"}</>
          ) : (
            <><ShoppingCart className="size-3.5" /> {locale === "ar" ? "أضف إلى السلة" : "Add to Cart"}</>
          )}
        </Button>
      </div>
    </div>
  );
}
