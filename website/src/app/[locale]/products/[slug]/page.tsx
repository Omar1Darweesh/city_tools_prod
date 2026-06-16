import { getTranslations } from "next-intl/server";
import ProductDetailView from "./view";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const isAr = locale === "ar";
  const siteName = isAr ? "سيتي تولز" : "City Tools";

  try {
    const res = await fetch(`${API_BASE}/store/products/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const p = json.data || json;
      if (p?.nameEn) {
        const name = isAr ? p.nameAr || p.nameEn : p.nameEn;
        const categoryName = p.category ? (isAr ? p.category.nameAr || p.category.name : p.category.name) : "";
        const brand = p.brand || "";
        const title = `${name} | ${siteName}`;
        const baseDesc = isAr
          ? `اشتر ${name}${brand ? ` من ${brand}` : ""}${categoryName ? ` - ${categoryName}` : ""} بأفضل الأسعار في سيتي تولز. توصيل سريع لجميع أنحاء مصر.`
          : `Buy ${name}${brand ? ` by ${brand}` : ""}${categoryName ? ` - ${categoryName}` : ""} at the best price from City Tools Egypt. Fast delivery nationwide.`;
        const desc = p.description || baseDesc;
        const ogImages = Array.isArray(p.images) && p.images.length > 0
          ? p.images.slice(0, 3).map((url: string) => ({ url, width: 1200, height: 630, alt: name }))
          : [{ url: "/assets/CT Logo.png", width: 1200, height: 630, alt: name }];
        const keywords = isAr
          ? [name, brand, categoryName, "سيتي تولز", "أدوات", "مصر"].filter(Boolean)
          : [name, brand, categoryName, "city tools", "tools", "egypt"].filter(Boolean);
        return {
          title,
          description: desc.slice(0, 160),
          keywords,
          openGraph: {
            title,
            description: desc.slice(0, 160),
            url: `${BASE_URL}/${locale}/products/${slug}`,
            type: "article",
            images: ogImages,
          },
          twitter: {
            card: "summary_large_image",
            title,
            description: desc.slice(0, 160),
            images: ogImages.map((i: { url: string }) => i.url),
          },
          alternates: {
            canonical: `${BASE_URL}/${locale}/products/${slug}`,
            languages: {
              en: `${BASE_URL}/en/products/${slug}`,
              ar: `${BASE_URL}/ar/products/${slug}`,
              "x-default": `${BASE_URL}/en/products/${slug}`,
            },
          },
        };
      }
    }
  } catch {}

  const fallbackTitle = isAr ? `منتج | ${siteName}` : `Product | ${siteName}`;
  return {
    title: fallbackTitle,
    alternates: {
      canonical: `${BASE_URL}/${locale}/products/${slug}`,
      languages: {
        en: `${BASE_URL}/en/products/${slug}`,
        ar: `${BASE_URL}/ar/products/${slug}`,
        "x-default": `${BASE_URL}/en/products/${slug}`,
      },
    },
  };
}

export default function Page(props: any) {
  return <ProductDetailView {...props} />;
}
