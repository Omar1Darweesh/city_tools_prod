"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProductImage from "@/components/products/product-image";
import {
  Minus, Plus, ShoppingCart, Star, Package,
  Check, ChevronLeft, ChevronRight,
  AlertTriangle, Layers
} from "lucide-react";
import { useState, useEffect, use } from "react";
import { useCart } from "@/components/cart/cart-context";

interface DisplayProduct {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  priceRetail: number;
  priceWholesale: number;
  discountPrice: number | null;
  categoryId: number;
  brand: string;
  description: string;
  images: string[];
  rating: number;
  inStock: boolean;
  stock?: number;
  badge: string | null;
  isPopular: boolean;
  isBestSale: boolean;
  unit: string;
  minQty: number;
  createdAt: string;
  itemTypeId?: number;
  itemType?: { name: string; nameAr: string };
  subcategory?: { name: string; nameAr: string };
  category?: { name: string; nameAr: string };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function fetchProduct(slug: string): Promise<DisplayProduct | null> {
  try {
    const url = `${API_BASE}/store/products/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const p = json.data || json;
    if (!p || !p.id) return null;
    return {
      id: p.id,
      code: p.code,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      priceRetail: Number(p.priceRetail),
      priceWholesale: Number(p.priceWholesale),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      categoryId: p.categoryId,
      brand: p.brand || "",
      description: p.description || "",
      images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
      rating: p.rating || 0,
      inStock: Boolean(p.inStock ?? ((p.availableStock ?? p.stock ?? 0) > 0)),
      stock: p.availableStock ?? p.stock ?? 0,
      badge: p.badge || null,
      isPopular: p.isPopular ?? false,
      isBestSale: p.isBestSale ?? false,
      unit: p.unit || "PCS",
      minQty: p.minQty || 1,
      createdAt: p.createdAt || "",
      itemTypeId: p.itemTypeId ?? undefined,
      itemType: p.itemType ? { name: p.itemType.name, nameAr: p.itemType.nameAr || p.itemType.name } : undefined,
      subcategory: p.subcategory ? { name: p.subcategory.name, nameAr: p.subcategory.nameAr || p.subcategory.name } : undefined,
      category: p.category ? { name: p.category.name, nameAr: p.category.nameAr || p.category.name } : undefined,
    };
  } catch {
    return null;
  }
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const { slug } = use(params);
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState<DisplayProduct | null | undefined>(undefined); // undefined = loading
  const [imgIndex, setImgIndex] = useState(0);

  const isRtl = locale === "ar";

  useEffect(() => {
    if (!slug) return;
    setProduct(undefined);
    fetchProduct(slug).then(setProduct);
  }, [slug]);

  // ── Loading state ───────────────────────────────────────────
  if (product === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 animate-pulse">
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-5 bg-muted rounded w-1/2" />
            <div className="h-10 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted rounded" />
            <div className="h-12 bg-muted rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <Package className="size-20 text-muted-foreground/20 mb-4" />
        <h2 className="text-2xl font-bold">{t("notFound")}</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">{t("notFoundDesc")}</p>
        <Button className="mt-6 rounded-full" asChild>
          <Link href="/products">{isRtl ? "تصفح المنتجات" : "Browse Products"}</Link>
        </Button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const currentImg = images[imgIndex];
  const displayPrice = product.discountPrice ?? product.priceRetail;
  const maxQty = Math.max(0, product.stock ?? 0);
  const stockLevel = product.inStock ? maxQty : 0;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price: displayPrice,
      categoryId: product.categoryId,
      image: images[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: locale === "ar" ? product.nameAr || product.nameEn : product.nameEn,
    description: product.description || "",
    sku: product.code,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      price: displayPrice,
      priceCurrency: "EGP",
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    image: images.length > 0 ? images[0] : undefined,
    ...(product.category && { category: locale === "ar" ? product.category.nameAr || product.category.name : product.category.name }),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: isRtl ? "الرئيسية" : "Home", item: `${API_BASE.replace("/api", "")}/${locale}` },
              { "@type": "ListItem", position: 2, name: isRtl ? "المنتجات" : "Products", item: `${API_BASE.replace("/api", "")}/${locale}/products` },
              { "@type": "ListItem", position: 3, name: locale === "ar" ? product.nameAr || product.nameEn : product.nameEn },
            ],
          }),
        }}
      />
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">
          {isRtl ? "الرئيسية" : "Home"}
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">
          {isRtl ? "المنتجات" : "Products"}
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <span className="text-foreground/70">
              {isRtl ? product.category.nameAr : product.category.name}
            </span>
          </>
        )}
        {product.subcategory && (
          <>
            <span>/</span>
            <span className="text-foreground/70">
              {isRtl ? product.subcategory.nameAr : product.subcategory.name}
            </span>
          </>
        )}
        {product.itemType && (
          <>
            <span>/</span>
            <span className="text-foreground/70">
              {isRtl ? product.itemType.nameAr : product.itemType.name}
            </span>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {isRtl ? product.nameAr : product.nameEn}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl bg-muted relative overflow-hidden border">
            {currentImg ? (
              <ProductImage src={currentImg} alt="" fill className="object-cover" sizes="600px" priority />
            ) : (
              <div className="flex size-full items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
                  className="size-28 text-muted-foreground/20">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
            {/* Badges overlay */}
            <div className="absolute top-3 start-3 flex flex-col gap-1.5">
              {product.badge === "SALE" && (
                <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">SALE</span>
              )}
              {product.badge === "NEW" && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">NEW</span>
              )}
              {product.isPopular && (
                <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">⭐ {isRtl ? "شائع" : "Popular"}</span>
              )}
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                className="flex size-8 items-center justify-center rounded-full border hover:bg-muted transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="flex gap-1">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIndex(i)}
                    className={`size-2 rounded-full transition-colors ${i === imgIndex ? "bg-primary" : "bg-muted-foreground/30"}`} />
                ))}
              </div>
              <button
                onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                className="flex size-8 items-center justify-center rounded-full border hover:bg-muted transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
              <Badge variant="outline" className="font-mono text-xs">{product.code}</Badge>
            </div>
            <h1 className="text-2xl font-bold leading-tight">
              {isRtl ? product.nameAr : product.nameEn}
            </h1>
            {isRtl && product.nameEn !== product.nameAr && (
              <p className="mt-1 text-sm text-muted-foreground">{product.nameEn}</p>
            )}
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i}
                  className={`size-4 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                />
              ))}
              <span className="ms-2 text-sm text-muted-foreground">{product.rating}</span>
            </div>
          )}

          {/* Price */}
          <div>
            {product.discountPrice ? (
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-primary">
                  EGP {product.discountPrice.toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  EGP {product.priceRetail.toLocaleString()}
                </span>
                <Badge variant="destructive">
                  {Math.round(((product.priceRetail - product.discountPrice) / product.priceRetail) * 100)}% OFF
                </Badge>
              </div>
            ) : (
              <span className="text-3xl font-bold">EGP {product.priceRetail.toLocaleString()}</span>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {isRtl ? `وحدة القياس: ${product.unit}` : `Unit: ${product.unit}`}
              {product.minQty > 1 && (
                <span className="ms-3">{isRtl ? `الحد الأدنى: ${product.minQty}` : `Min. qty: ${product.minQty}`}</span>
              )}
            </p>
          </div>

          <Separator />

          {/* Stock indicator */}
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{isRtl ? "المخزون:" : "Stock:"}</span>
            {stockLevel === null ? (
              <span className="text-sm text-green-600 font-semibold">{isRtl ? "متوفر" : "In Stock"}</span>
            ) : stockLevel === 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 border border-red-200">
                <AlertTriangle className="size-3" />
                {isRtl ? "نفد المخزون" : "Out of Stock"}
              </span>
            ) : stockLevel <= 5 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                ⚠️ {isRtl ? `باقي ${stockLevel} فقط` : `Only ${stockLevel} left`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700 border border-green-200">
                ✓ {isRtl ? `${stockLevel} متوفر` : `${stockLevel} available`}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold mb-1.5 text-sm">{t("description")}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
            </div>
          )}

          {/* Add to cart */}
          {product.inStock && maxQty > 0 ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center rounded-full border overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-none"
                  onClick={() => setQuantity(Math.max(product.minQty || 1, quantity - 1))}
                  disabled={quantity <= (product.minQty || 1)}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-12 text-center text-sm font-bold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-none"
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                  disabled={quantity >= maxQty}
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              <Button
                size="lg"
                className="flex-1 rounded-full min-w-[180px]"
                onClick={handleAddToCart}
                variant={added ? "secondary" : "default"}
              >
                {added ? (
                  <>
                    <Check className="size-4 me-2" />
                    {isRtl ? "تمت الإضافة ✓" : "Added to Cart ✓"}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-4 me-2" />
                    {t("addToCart")} — EGP {(displayPrice * quantity).toLocaleString()}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button size="lg" className="rounded-full" disabled>
              {t("outOfStock")}
            </Button>
          )}

          {/* Max qty notice */}
          {maxQty > 0 && maxQty < 999 && (
            <p className="text-xs text-muted-foreground">
              {isRtl
                ? `* الحد الأقصى للطلب: ${maxQty} قطعة`
                : `* Max order quantity: ${maxQty} units`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
