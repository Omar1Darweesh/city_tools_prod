import { getTranslations } from "next-intl/server";
import CategoryDetailView from "./view";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const isAr = locale === "ar";
  const siteName = isAr ? "سيتي تولز" : "City Tools";

  try {
    const res = await fetch(`${API_BASE}/store/categories/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const c = json.data || json;
      if (c?.name) {
        const name = isAr ? c.nameAr || c.name : c.name;
        const title = `${name} | ${siteName}`;
        const description = isAr
          ? `تصفح تشكيلة ${name} في سيتي تولز. أفضل الأسعار وأسرع توصيل في مصر.`
          : `Browse our ${name} collection at City Tools. Best prices and fastest delivery in Egypt.`;
        return {
          title,
          description,
          openGraph: {
            title,
            description,
            url: `${BASE_URL}/${locale}/categories/${slug}`,
            images: [{ url: "/assets/CT Logo.png", width: 1200, height: 630, alt: name }],
          },
          twitter: { card: "summary_large_image", title, description, images: ["/assets/CT Logo.png"] },
          alternates: {
            canonical: `${BASE_URL}/${locale}/categories/${slug}`,
            languages: {
              en: `${BASE_URL}/en/categories/${slug}`,
              ar: `${BASE_URL}/ar/categories/${slug}`,
              "x-default": `${BASE_URL}/en/categories/${slug}`,
            },
          },
        };
      }
    }
  } catch {}

  const fallbackTitle = isAr ? `الأقسام | ${siteName}` : `Categories | ${siteName}`;
  return {
    title: fallbackTitle,
    alternates: {
      canonical: `${BASE_URL}/${locale}/categories/${slug}`,
      languages: {
        en: `${BASE_URL}/en/categories/${slug}`,
        ar: `${BASE_URL}/ar/categories/${slug}`,
        "x-default": `${BASE_URL}/en/categories/${slug}`,
      },
    },
  };
}

export default function Page(props: any) {
  return <CategoryDetailView {...props} />;
}
