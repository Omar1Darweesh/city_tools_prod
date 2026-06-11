"use client";

import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/products/product-card";
import { ProductListItem } from "@/components/products/product-list-item";
import { SortSelect } from "@/components/products/sort-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { store } from "@/data";
import type { MockProduct, MockCategory, MockSubcategory, MockItemType, StockThreshold } from "@/data";
import { Search, Grid3X3, List, SlidersHorizontal, X, Package, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useEffect, Suspense } from "react";

function ProductsContent() {
  const t = useTranslations("Products");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("search") || "";
  const categoryParam = searchParams.get("categoryId");

  const [searchInput, setSearchInput] = useState(query);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    categoryParam ? Number(categoryParam) : undefined
  );
  const [filterSubcategory, setFilterSubcategory] = useState<number | undefined>(undefined);
  const [filterItemType, setFilterItemType] = useState<number | undefined>(undefined);
  const [filterPopular, setFilterPopular] = useState(false);
  const [filterBestSale, setFilterBestSale] = useState(false);
  const [filterDiscounted, setFilterDiscounted] = useState(false);
  const [filterBadge, setFilterBadge] = useState<string | undefined>(undefined);
  const [minRating, setMinRating] = useState(0);
  const [stockThreshold, setStockThreshold] = useState<StockThreshold | "all">("all");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/products?search=${encodeURIComponent(searchInput)}`);
  };

  const handleCategoryChange = (catId: number | undefined) => {
    setSelectedCategory(catId);
    setFilterSubcategory(undefined);
    setFilterItemType(undefined);
    setShowFilters(false);
  };

  const handleSubcategoryChange = (subId: number | undefined) => {
    setFilterSubcategory(subId);
    setFilterItemType(undefined);
  };

  const [products, setProducts] = useState<MockProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cats, setCats] = useState<MockCategory[]>([]);
  const [subcats, setSubcats] = useState<MockSubcategory[]>([]);
  const [itemTypes, setItemTypes] = useState<MockItemType[]>([]);
  const PAGE_SIZE = 24;

  useEffect(() => { store.getCategories().then(setCats); }, []);
  useEffect(() => {
    (selectedCategory ? store.getSubcategories(selectedCategory) : store.getSubcategories()).then(setSubcats);
  }, [selectedCategory]);
  useEffect(() => {
    (filterSubcategory ? store.getItemTypes(filterSubcategory) : store.getItemTypes()).then(setItemTypes);
  }, [filterSubcategory]);

  const clearFilters = () => {
    setSearchInput("");
    setSelectedCategory(undefined);
    setFilterSubcategory(undefined);
    setFilterItemType(undefined);
    setFilterPopular(false);
    setFilterBestSale(false);
    setFilterDiscounted(false);
    setFilterBadge(undefined);
    setMinRating(0);
    setStockThreshold("all");
    setSort("newest");
    router.push("/products");
  };

  const showAllProducts = () => {
    setFilterPopular(false);
    setFilterBestSale(false);
    setFilterDiscounted(false);
    setFilterBadge(undefined);
    setSelectedCategory(undefined);
    setFilterSubcategory(undefined);
    setFilterItemType(undefined);
    setMinRating(0);
    setStockThreshold("all");
    setSearchInput("");
    setSort("newest");
    router.push("/products");
  };

  const filterDeps = [query, selectedCategory, filterSubcategory, filterItemType, sort, filterPopular, filterBestSale, filterDiscounted, filterBadge, minRating, stockThreshold];

  useEffect(() => { setPage(1); }, filterDeps);

  useEffect(() => {
    store.getProducts({
      page,
      limit: PAGE_SIZE,
      search: query,
      categoryId: selectedCategory,
      subcategoryId: filterSubcategory,
      itemTypeId: filterItemType,
      sort,
      isPopular: filterPopular || undefined,
      isBestSale: filterBestSale || undefined,
      discounted: filterDiscounted || undefined,
      badge: filterBadge,
      minRating: minRating || undefined,
      stockThreshold: stockThreshold !== "all" ? (stockThreshold as StockThreshold) : undefined,
    }).then((res) => {
      setProducts(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    });
  }, [...filterDeps, page]);

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">
          {query ? t("searchResults", { query }) : t("title")}
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {total} {locale === "ar" ? "منتج" : "products"}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-[200px]">
          <Search className="absolute start-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={locale === "ar" ? "ابحث..." : "Search..."}
            className="h-8 rounded-full ps-8 text-xs"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); router.push("/products"); }}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-8 text-xs lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="size-3" />
            {locale === "ar" ? "تصفية" : "Filter"}
          </Button>

          <SortSelect value={sort} onValueChange={setSort} locale={locale} />

          <div className="flex items-center rounded-full border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-full size-7"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-full size-7"
              onClick={() => setViewMode("list")}
            >
              <List className="size-3.5" />
            </Button>
        </div>
      </div>
    </div>

      {/* Quick Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <button
          onClick={showAllProducts}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !filterPopular && !filterBestSale && !filterDiscounted && !filterBadge && !minRating && stockThreshold === "all" && !selectedCategory && !query
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {locale === "ar" ? "الكل" : "All"}
        </button>
        <button
          onClick={() => setFilterPopular(!filterPopular)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            filterPopular
              ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          ⭐ {locale === "ar" ? "شائع" : "Popular"}
        </button>
        <button
          onClick={() => setFilterBestSale(!filterBestSale)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            filterBestSale
              ? "border-red-400 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          🔥 {locale === "ar" ? "الأكثر مبيعاً" : "Best Sellers"}
        </button>
        <button
          onClick={() => setFilterDiscounted(!filterDiscounted)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            filterDiscounted
              ? "border-green-400 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          🏷️ {locale === "ar" ? "عروض" : "Discounted"}
        </button>
        <button
          onClick={() => setFilterBadge(filterBadge === "NEW" ? undefined : "NEW")}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            filterBadge === "NEW"
              ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          🆕 {locale === "ar" ? "جديد" : "New"}
        </button>
        <Select value={String(minRating)} onValueChange={(v) => setMinRating(Number(v))}>
          <SelectTrigger className="h-7 text-xs w-[100px] rounded-full">
            <SelectValue placeholder={locale === "ar" ? "التقييم" : "Rating"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{locale === "ar" ? "الكل" : "All"}</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {"★".repeat(r)}{"☆".repeat(5 - r)}+
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockThreshold} onValueChange={(v) => setStockThreshold(v as StockThreshold | "all")}>
          <SelectTrigger className="h-7 text-xs w-[110px] rounded-full">
            <SelectValue placeholder={locale === "ar" ? "المخزون" : "Stock"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{locale === "ar" ? "الكل" : "All"}</SelectItem>
            <SelectItem value="low">{locale === "ar" ? "منخفض" : "Low"}</SelectItem>
            <SelectItem value="moderate">{locale === "ar" ? "متوسط" : "Moderate"}</SelectItem>
            <SelectItem value="high">{locale === "ar" ? "مرتفع" : "High"}</SelectItem>
          </SelectContent>
        </Select>
        {(filterPopular || filterBestSale || filterDiscounted || filterBadge || minRating > 0 || stockThreshold !== "all" || selectedCategory || query) && (
          <button onClick={clearFilters} className="text-[10px] text-muted-foreground hover:text-foreground underline ms-1">
            {locale === "ar" ? "مسح" : "Clear"}
          </button>
        )}
      </div>

      <div className="flex gap-4">
        {/* Sidebar Filters (desktop) */}
        <aside className="hidden w-44 shrink-0 lg:block">
          <div className="sticky top-20 space-y-4">
            {[
              { key: "categories", labelEn: "Categories", labelAr: "الأقسام", hidden: false },
              { key: "subcategories", labelEn: "Subcategories", labelAr: "التصنيفات الفرعية", hidden: !selectedCategory },
              { key: "types", labelEn: "Types", labelAr: "الأنواع", hidden: !filterSubcategory },
            ].filter((s) => !s.hidden).map(({ key, labelEn, labelAr }) => {
              const collapsed = collapsedSections[key];
              return (
                <div key={key}>
                  <button
                    onClick={() => toggleSection(key)}
                    className="flex w-full items-center justify-between mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    <span>{locale === "ar" ? labelAr : labelEn}</span>
                    <ChevronDown className={`size-3 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
                  </button>
                  {!collapsed && (
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => {
                          if (key === "categories") handleCategoryChange(undefined);
                          else if (key === "subcategories") setFilterSubcategory(undefined);
                          else setFilterItemType(undefined);
                        }}
                        className={`rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                          key === "categories"
                            ? !selectedCategory ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            : key === "subcategories"
                            ? !filterSubcategory ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            : !filterItemType ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {locale === "ar" ? "الكل" : "All"}
                      </button>
                      {(key === "categories" ? cats : key === "subcategories" ? subcats : itemTypes).map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (key === "categories") handleCategoryChange(item.id);
                            else if (key === "subcategories") handleSubcategoryChange(item.id);
                            else setFilterItemType(item.id);
                          }}
                          className={`rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                            key === "categories"
                              ? selectedCategory === item.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              : key === "subcategories"
                              ? filterSubcategory === item.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              : filterItemType === item.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accept-foreground"
                          }`}
                        >
                          {locale === "ar" ? item.nameAr : item.name}
                          <span className="float-end text-[10px] opacity-60">{item.productCount}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
            <div className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-background p-4">
              <h3 className="mb-3 text-base font-semibold">
                {locale === "ar" ? "تصفية" : "Filter"}
              </h3>
              {[
                { key: "categories", labelEn: "Categories", labelAr: "الأقسام", hidden: false },
                { key: "subcategories", labelEn: "Subcategories", labelAr: "التصنيفات الفرعية", hidden: !selectedCategory },
                { key: "types", labelEn: "Types", labelAr: "الأنواع", hidden: !filterSubcategory },
              ].filter((s) => !s.hidden).map(({ key, labelEn, labelAr }) => {
                const collapsed = collapsedSections[key + "_mobile"];
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggleSection(key + "_mobile")}
                      className="mt-3 mb-1 flex w-full items-center justify-between text-sm font-semibold"
                    >
                      <span>{locale === "ar" ? labelAr : labelEn}</span>
                      <ChevronDown className={`size-3.5 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
                    </button>
                    {!collapsed && (
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => {
                            if (key === "categories") handleCategoryChange(undefined);
                            else if (key === "subcategories") setFilterSubcategory(undefined);
                            else setFilterItemType(undefined);
                          }}
                          className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            key === "categories"
                              ? !selectedCategory ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                              : key === "subcategories"
                              ? !filterSubcategory ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                              : !filterItemType ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                          }`}
                        >
                          {locale === "ar" ? "الكل" : "All"}
                        </button>
                        {(key === "categories" ? cats : key === "subcategories" ? subcats : itemTypes).map((item: any) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (key === "categories") handleCategoryChange(item.id);
                              else if (key === "subcategories") handleSubcategoryChange(item.id);
                              else setFilterItemType(item.id);
                            }}
                            className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              key === "categories"
                                ? selectedCategory === item.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                                : key === "subcategories"
                                ? filterSubcategory === item.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                                : filterItemType === item.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                            }`}
                          >
                            {locale === "ar" ? item.nameAr : item.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Products Area */}
        <div className="flex-1">
          {products.length === 0 ? (
            <EmptyState
              icon={<Package className="size-16" />}
              title={t("noResults")}
              description={t("noResultsDesc")}
              actionLabel={locale === "ar" ? "مسح التصفية" : "Clear Filter"}
              onAction={clearFilters}
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {products.map((product) => (
                <ProductListItem key={product.id} product={product} locale={locale} />
              ))}
            </div>
          )}

          {/* Pagination */}
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
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
