"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { ProductGrid } from "@/components/products/product-grid";
import { SortSelect } from "@/components/products/sort-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { store } from "@/data";
import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Package, Zap, Wrench, Bolt, Droplets, Shield, Factory, Settings, Toolbox, Star } from "lucide-react";
import type { MockProduct, MockCategory, MockSubcategory, MockItemType, MockBrand } from "@/data";
import { buildLogoByName, getCategoryLogo } from "@/lib/brand-logo";

const ICON_COMPONENT: Record<string, ReactNode> = {
  Zap: <Zap className="size-4 text-white" />,
  Wrench: <Wrench className="size-4 text-white" />,
  Bolt: <Bolt className="size-4 text-white" />,
  Droplets: <Droplets className="size-4 text-white" />,
  Shield: <Shield className="size-4 text-white" />,
  Factory: <Factory className="size-4 text-white" />,
  Package: <Package className="size-4 text-white" />,
  Settings: <Settings className="size-4 text-white" />,
  Tool: <Toolbox className="size-4 text-white" />,
  Star: <Star className="size-4 text-white" />,
};

function getCatIcon(icon: string): ReactNode {
  const key = icon ? icon.charAt(0).toUpperCase() + icon.slice(1) : "";
  return ICON_COMPONENT[key] || <Package className="size-4 text-white" />;
}

function ProductGridSkeleton() {
  return (
    <ProductGrid>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border bg-card">
          <div className="aspect-[3/2] animate-pulse bg-muted" />
          <div className="space-y-2 p-2">
            <div className="h-2 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-6 w-full animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </ProductGrid>
  );
}

interface Props {
  initialCategory: MockCategory;
}

export default function CategoryDetailPage({ initialCategory }: Props) {
  const locale = useLocale();
  const [sort, setSort] = useState("newest");
  const category = initialCategory;
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState<string>("_all");
  const [filterSubcategory, setFilterSubcategory] = useState<number | undefined>(undefined);
  const [filterItemType, setFilterItemType] = useState<number | undefined>(undefined);
  const [subcats, setSubcats] = useState<MockSubcategory[]>([]);
  const [itemTypes, setItemTypes] = useState<MockItemType[]>([]);
  const [brands, setBrands] = useState<MockBrand[]>([]);
  const [brandLogos, setBrandLogos] = useState<MockBrand[]>([]);
  const PAGE_SIZE = 24;

  useEffect(() => {
    store.getTrustedBrands().then(setBrandLogos);
    store.getSubcategories(category.id).then(setSubcats);
    store.getBrands(category.id).then(setBrands);
  }, [category.id]);

  useEffect(() => {
    if (filterSubcategory) store.getItemTypes(filterSubcategory).then(setItemTypes);
    else setItemTypes([]);
  }, [filterSubcategory]);

  useEffect(() => { setPage(1); }, [sort, filterBrand, filterSubcategory, filterItemType]);

  useEffect(() => {
    setProductsLoading(true);
    store.getProducts({
      categoryId: category.id,
      subcategoryId: filterSubcategory,
      itemTypeId: filterItemType,
      sort,
      page,
      limit: PAGE_SIZE,
      brand: filterBrand === "_all" ? undefined : filterBrand,
    }).then((res) => {
      setProducts(res.data as MockProduct[]);
      setTotalCount(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
      setProductsLoading(false);
    });
  }, [category.id, sort, page, filterBrand, filterSubcategory, filterItemType]);

  const logoByName = useMemo(() => buildLogoByName(brandLogos), [brandLogos]);
  const logoSrc = getCategoryLogo(category, logoByName);

  const breadcrumbItems = [
    { label: locale === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: locale === "ar" ? "الأقسام" : "Categories", href: "/categories" },
    { label: locale === "ar" ? category.nameAr : category.name },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={breadcrumbItems} locale={locale} />

      <div className="mb-8">
        {logoSrc ? (
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-border bg-white p-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt={category.name} className="size-full object-contain" />
          </div>
        ) : (
          <div
            className="mb-4 flex size-12 items-center justify-center rounded-2xl shadow-sm"
            style={{ background: `linear-gradient(135deg, ${category.color || "#6b7280"}, ${category.color ? category.color + "99" : "#9ca3af"})` }}
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-white/20">
              {getCatIcon(category.icon)}
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold">
          {locale === "ar" ? category.nameAr : category.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {productsLoading ? "…" : totalCount} {locale === "ar" ? "منتج" : "products"}
        </p>
      </div>

      {subcats.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => { setFilterSubcategory(undefined); setFilterItemType(undefined); }}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !filterSubcategory
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {locale === "ar" ? "الكل" : "All"}
          </button>
          {subcats.map((sub) => (
            <button
              key={sub.id}
              onClick={() => { setFilterSubcategory(sub.id); setFilterItemType(undefined); }}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filterSubcategory === sub.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {locale === "ar" ? sub.nameAr : sub.name}
            </button>
          ))}
        </div>
      )}

      {itemTypes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterItemType(undefined)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !filterItemType
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {locale === "ar" ? "الكل" : "All"}
          </button>
          {itemTypes.map((it) => (
            <button
              key={it.id}
              onClick={() => setFilterItemType(it.id)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filterItemType === it.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {locale === "ar" ? it.nameAr : it.name}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex-1" />
        {brands.length > 1 && (
          <Select value={filterBrand} onValueChange={(v) => setFilterBrand(v)}>
            <SelectTrigger className="h-8 w-[140px] rounded-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all" className="text-xs">{locale === "ar" ? "جميع الماركات" : "All Brands"}</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.name} value={b.name} className="text-xs">
                  {locale === "ar" ? b.nameAr : b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <SortSelect value={sort} onValueChange={setSort} locale={locale} />
      </div>

      {productsLoading ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="size-16" />}
          title={locale === "ar" ? "لا توجد منتجات" : "No products found"}
          description={locale === "ar" ? "هذا القسم لا يحتوي على منتجات بعد" : "This category doesn't have any products yet"}
          actionLabel={locale === "ar" ? "عرض جميع المنتجات" : "View All Products"}
          actionHref="/products"
        />
      ) : (
        <>
          <ProductGrid>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </ProductGrid>
          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {locale === "ar" ? "السابق" : "Previous"}
              </Button>
              <span className="px-3 text-xs text-muted-foreground">
                {locale === "ar" ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {locale === "ar" ? "التالي" : "Next"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
