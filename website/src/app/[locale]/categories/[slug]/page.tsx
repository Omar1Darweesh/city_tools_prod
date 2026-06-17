import { notFound } from "next/navigation";
import CategoryDetailView from "./view";
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_META } from "@/lib/seo";

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
            images: [{ ...DEFAULT_OG_IMAGE_META, alt: name }],
          },
          twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE] },
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

  notFound();
}

async function fetchCategory(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/store/categories/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      return json.data || json;
    }
  } catch {}
  return null;
}

function toInitialCategory(c: Record<string, unknown>, slug: string) {
  return {
    id: c.id as number,
    name: String(c.name || ""),
    nameAr: String(c.nameAr || c.name || ""),
    slug: String(c.slug || slug),
    color: String(c.color || "#2563eb"),
    icon: String(c.icon || "Wrench"),
    productCount: Number(c.productCount || 0),
  };
}

export default async function Page(props: any) {
  const { locale, slug } = await props.params;
  const isAr = locale === "ar";
  const c = await fetchCategory(slug);

  if (!c?.name) {
    notFound();
  }

  const name = isAr ? c.nameAr || c.name : c.name;
  const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: `${BASE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: isAr ? "الأقسام" : "Categories", item: `${BASE_URL}/${locale}/categories` },
        { "@type": "ListItem", position: 3, name, item: `${BASE_URL}/${locale}/categories/${slug}` },
      ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CategoryDetailView initialCategory={toInitialCategory(c, slug)} />
    </>
  );
}
