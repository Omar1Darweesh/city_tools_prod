"use client";

import { useLocale } from "next-intl";
import { useParams, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { ProductGrid } from "@/components/products/product-grid";
import { SortSelect } from "@/components/products/sort-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { store, getCategoryBySlug } from "@/data";
import { useState, useEffect, type ReactNode } from "react";
import { Package, Zap, Wrench, Bolt, Droplets, Shield, Factory, Settings, Toolbox, Star, ChevronLeft, ChevronRight } from "lucide-react";
import type { MockProduct, MockCategory, MockSubcategory, MockItemType, MockBrand } from "@/data";

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

export default function CategoryDetailPage() {
  const locale = useLocale();
  const params = useParams<{ slug: string }>();
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState<MockCategory | undefined>(undefined);
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState<string>("_all");
  const [filterSubcategory, setFilterSubcategory] = useState<number | undefined>(undefined);
  const [filterItemType, setFilterItemType] = useState<number | undefined>(undefined);
  const [subcats, setSubcats] = useState<MockSubcategory[]>([]);
  const [itemTypes, setItemTypes] = useState<MockItemType[]>([]);
  const [brands, setBrands] = useState<MockBrand[]>([]);
  const PAGE_SIZE = 24;

  useEffect(() => {
    (async () => {
      const cat = await getCategoryBySlug(params.slug);
      setCategory(cat);
    })();
  }, [params.slug]);

  useEffect(() => {
    if (category) {
      store.getSubcategories(category.id).then(setSubcats);
      store.getBrands(category.id).then(setBrands);
    }
  }, [category]);

  useEffect(() => {
    if (filterSubcategory) store.getItemTypes(filterSubcategory).then(setItemTypes);
    else setItemTypes([]);
  }, [filterSubcategory]);

  useEffect(() => { setPage(1); }, [category, sort, filterBrand, filterSubcategory, filterItemType]);

  useEffect(() => {
    if (!category) return;
    store.getProducts({ categoryId: category.id, subcategoryId: filterSubcategory, itemTypeId: filterItemType, sort, page, limit: PAGE_SIZE, brand: filterBrand === "_all" ? undefined : filterBrand }).then((res) => {
      setProducts(res.data as MockProduct[]);
      setTotalCount(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
      setLoading(false);
    });
  }, [category, sort, page, filterBrand, filterSubcategory, filterItemType]);

  if (!loading && !category) {
    notFound();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
        {locale === "ar" ? "جاري التحميل..." : "Loading..."}
      </div>
    );
  }

  const breadcrumbItems = [
    { label: locale === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: locale === "ar" ? "الأقسام" : "Categories", href: "/categories" },
    { label: locale === "ar" ? category!.nameAr : category!.name },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={breadcrumbItems} locale={locale} />

      <div className="mb-8">
        <div className="flex size-12 items-center justify-center rounded-2xl shadow-sm mb-4" style={{ background: `linear-gradient(135deg, ${category!.color || "#6b7280"}, ${category!.color ? category!.color + "99" : "#9ca3af"})` }}>
          <div className="flex size-7 items-center justify-center rounded-lg bg-white/20">
            {getCatIcon(category!.icon)}
          </div>
        </div>
        <h1 className="text-3xl font-bold">
          {locale === "ar" ? category!.nameAr : category!.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {totalCount} {locale === "ar" ? "منتج" : "products"}
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
        {brands.length > 0 && (
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

      {products.length === 0 ? (
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
                size="icon"
                className="rounded-full size-7"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="size-3" />
              </Button>
              {(() => {
                const pages: (number | "...")[] = [];
                const delta = 2;
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                    pages.push(i);
                  } else if (pages[pages.length - 1] !== "...") {
                    pages.push("...");
                  }
                }
                return pages.map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="text-xs text-muted-foreground px-1">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="icon"
                      className="rounded-full size-7 text-[11px]"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                );
              })()}
              <Button
                variant="outline"
                size="icon"
                className="rounded-full size-7"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="size-3" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
