"use client";

import type { MockProduct } from "@/data";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/cart-context";
import Image from "next/image";
import { ShoppingCart, Star, Check } from "lucide-react";
import { useState } from "react";

export function ProductCard({ product, locale }: { product: MockProduct; locale: string }) {
  const price = product.discountPrice ?? product.priceRetail;
  const gradient = "from-gray-500 to-gray-600";
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

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
      <div className="group relative overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:shadow-sm">
      <Link href={`/products/${product.code || product.id}`} className="block">
        <div className="aspect-[3/2] relative overflow-hidden">
          {product.images?.[0] ? (
            <Image src={product.images[0]} alt="" fill className="object-cover" sizes="150px" />
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
      <div className="p-2">
        <Link href={`/products/${product.code || product.id}`}>
          <p className="text-[9px] text-muted-foreground truncate">{product.brand}</p>
          <h3 className="font-medium line-clamp-2 text-[11px] leading-tight group-hover:text-primary transition-colors">
            {locale === "ar" ? product.nameAr : product.nameEn}
          </h3>
        </Link>
        {product.rating > 0 && (
          <div className="flex items-center gap-px mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-2 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
              />
            ))}
            <span className="text-[8px] text-muted-foreground ms-px">{product.rating}</span>
          </div>
        )}
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
        <Button
          size="sm"
          className="mt-1.5 w-full rounded-full text-[9px] h-6"
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
