"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Search, Award } from "lucide-react";
import { store, type MockBrand } from "@/data";
import { resolveBrandLogo } from "@/lib/brand-logo";
import Image from "next/image";

export default function BrandsView() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState<MockBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store
      .getTrustedBrands()
      .then(setBrands)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.nameAr || "").toLowerCase().includes(q),
    );
  }, [brands, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          {isRtl ? "الماركات المعتمدة" : "Trusted Brands"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isRtl
            ? "تسوق من أشهر الماركات العالمية للأدوات والمعدات"
            : "Shop from leading global tool and equipment brands"}
        </p>
      </div>

      <div className="relative mx-auto mb-8 max-w-md">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={isRtl ? "ابحث عن ماركة..." : "Search brands..."}
          className="h-10 w-full rounded-full ps-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          {isRtl ? "جاري التحميل..." : "Loading brands..."}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          {isRtl ? "لا توجد ماركات تطابق بحثك" : "No brands match your search"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((brand) => {
            const label = isRtl ? brand.nameAr || brand.name : brand.name;
            const logo = resolveBrandLogo(brand.logo);
            const href = `/products?brand=${encodeURIComponent(brand.name)}`;

            return (
              <Link
                key={String(brand.id)}
                href={href}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="flex h-16 w-full items-center justify-center rounded-xl bg-muted/40 px-3">
                  {logo ? (
                    <Image
                      src={logo}
                      alt={label}
                      width={120}
                      height={48}
                      className="max-h-12 w-auto object-contain"
                      unoptimized
                    />
                  ) : (
                    <Award className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                <span className="text-sm font-semibold text-center group-hover:text-primary transition-colors">
                  {label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {brand.productCount}{" "}
                  {isRtl ? "منتج" : brand.productCount === 1 ? "product" : "products"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
