"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Search, Package, Zap, Wrench, Bolt, Droplets, Shield, Factory, Settings, Toolbox } from "lucide-react";
import { store } from "@/data";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { groupSubcategoriesByName, subcategoryGroupProductsHref } from "@/lib/subcategory-groups";

const SUBCAT_COLORS = ["#f97316", "#22c55e", "#eab308", "#06b6d4", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"];
const ICON_COMPONENT: Record<string, ReactNode> = {
  Zap: <Zap className="size-7 text-white" />,
  Wrench: <Wrench className="size-7 text-white" />,
  Bolt: <Bolt className="size-7 text-white" />,
  Droplets: <Droplets className="size-7 text-white" />,
  Shield: <Shield className="size-7 text-white" />,
  Factory: <Factory className="size-7 text-white" />,
  Package: <Package className="size-7 text-white" />,
  Settings: <Settings className="size-7 text-white" />,
  Toolbox: <Toolbox className="size-7 text-white" />,
};
const ICON_KEYS = ["Wrench", "Zap", "Bolt", "Droplets", "Shield", "Factory", "Package", "Settings", "Toolbox"];

function getSubcatIcon(index: number): ReactNode {
  const key = ICON_KEYS[index % ICON_KEYS.length];
  return ICON_COMPONENT[key] || <Package className="size-7 text-white" />;
}

export default function TypesPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [search, setSearch] = useState("");
  const [subcats, setSubcats] = useState<Awaited<ReturnType<typeof store.getSubcategories>>>([]);

  useEffect(() => {
    store.getSubcategories().then(setSubcats);
  }, []);

  const groups = useMemo(() => groupSubcategoriesByName(subcats, locale), [subcats, locale]);

  const filtered = groups.filter((g) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      g.nameAr.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          {isRtl ? "تصفح جميع الفئات" : "Browse All Types"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isRtl
            ? "اكتشف المنتجات حسب الفئة: يدوي، كهربائي، اكسسوارات وأكثر"
            : "Discover products by type: manual, electric, accessories and more"}
        </p>
      </div>

      <div className="relative mx-auto mb-8 max-w-md">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={isRtl ? "ابحث عن فئة..." : "Search types..."}
          className="h-10 w-full rounded-full ps-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          {isRtl ? "لا توجد فئات تطابق بحثك" : "No types match your search"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((group, i) => {
            const color = SUBCAT_COLORS[i % SUBCAT_COLORS.length];
            const label = isRtl ? group.nameAr || group.name : group.name;
            return (
              <Link
                key={group.key}
                href={subcategoryGroupProductsHref(group)}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <div
                  className="flex size-20 items-center justify-center rounded-full shadow-md transition-transform group-hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
                >
                  {getSubcatIcon(i)}
                </div>
                <span className="text-sm font-semibold text-center group-hover:text-primary transition-colors">
                  {label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {group.productCount} {isRtl ? "منتج" : "products"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
