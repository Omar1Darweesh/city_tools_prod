import type { MockSubcategory } from "@/data";

export interface SubcategoryGroup {
  key: string;
  name: string;
  nameAr: string;
  ids: number[];
  productCount: number;
}

/** Merge subcategories that share the same display name (e.g. اكسسوارات under multiple ماركات). */
export function groupSubcategoriesByName(
  subcats: MockSubcategory[],
  locale: string,
): SubcategoryGroup[] {
  const map = new Map<string, SubcategoryGroup>();

  for (const sub of subcats) {
    const nameAr = (sub.nameAr || sub.name || "").trim();
    const name = (sub.name || sub.nameAr || "").trim();
    const key = nameAr.toLowerCase() || name.toLowerCase();
    if (!key) continue;

    const existing = map.get(key);
    if (existing) {
      existing.ids.push(sub.id);
      existing.productCount += sub.productCount ?? 0;
    } else {
      map.set(key, {
        key,
        name,
        nameAr,
        ids: [sub.id],
        productCount: sub.productCount ?? 0,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const labelA = locale === "ar" ? a.nameAr || a.name : a.name;
    const labelB = locale === "ar" ? b.nameAr || b.name : b.name;
    return labelA.localeCompare(labelB, locale === "ar" ? "ar" : "en");
  });
}

export function subcategoryGroupProductsHref(group: Pick<SubcategoryGroup, "name" | "nameAr" | "ids">): string {
  const label = (group.nameAr || group.name).trim();
  if (label) {
    return `/products?subcategoryName=${encodeURIComponent(label)}`;
  }
  if (group.ids.length === 1) return `/products?subcategoryId=${group.ids[0]}`;
  return `/products?subcategoryIds=${group.ids.join(",")}`;
}
