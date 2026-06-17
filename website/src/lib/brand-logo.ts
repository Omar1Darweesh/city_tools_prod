import type { MockBrand, MockCategory } from "@/data";

export function resolveBrandLogo(logo?: string | null): string | null {
  if (!logo) return null;
  if (logo.startsWith("http://") || logo.startsWith("https://") || logo.startsWith("/")) return logo;
  return `/${logo.replace(/^\/+/, "")}`;
}

export function buildLogoByName(brands: MockBrand[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const b of brands) {
    if (!b.logo) continue;
    map.set(b.name.toLowerCase(), b.logo);
    if (b.nameAr) map.set(b.nameAr.toLowerCase(), b.logo);
  }
  return map;
}

export function getCategoryLogo(
  cat: Pick<MockCategory, "name" | "nameAr">,
  logoByName: Map<string, string>,
): string | null {
  const logo =
    logoByName.get(cat.name.toLowerCase()) ||
    logoByName.get((cat.nameAr || "").toLowerCase()) ||
    null;
  return resolveBrandLogo(logo);
}
