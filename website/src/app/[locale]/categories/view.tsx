"use client";

import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CategoryCard } from "@/components/products/category-card";
import { store } from "@/data";
import type { MockCategory } from "@/data";
import { useEffect, useState } from "react";

export default function CategoriesPage() {
  const locale = useLocale();
  const [cats, setCats] = useState<MockCategory[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { store.getCategories().then(setCats); }, []);

  const filtered = cats.filter(
    (cat) =>
      cat.nameAr.includes(search) ||
      cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          {locale === "ar" ? "تصفح جميع الأقسام" : "Browse All Categories"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "اكتشف منتجات مذهلة عبر جميع الأقسام المنتقاة بعناية"
            : "Discover amazing products across all carefully curated categories"}
        </p>
      </div>

      <div className="relative mx-auto mb-8 max-w-md">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={locale === "ar" ? "ابحث عن قسم..." : "Search categories..."}
          className="h-10 w-full rounded-full ps-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">
            {locale === "ar" ? "لا توجد أقسام تطابق بحثك" : "No categories match your search"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((cat) => (
            <CategoryCard key={cat.id} category={cat} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
