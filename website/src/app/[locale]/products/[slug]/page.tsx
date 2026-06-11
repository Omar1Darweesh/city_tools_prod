import { getTranslations } from "next-intl/server";
import ProductDetailView from "./view";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";

  try {
    const res = await fetch(`${API_BASE}/store/products/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const p = json.data || json;
      if (p?.nameEn) {
        const name = locale === "ar" ? p.nameAr || p.nameEn : p.nameEn;
        const desc = p.description || (locale === "ar" ? "منتج من سيتي تولز" : "Product from City Tools");
        const images = Array.isArray(p.images) && p.images.length > 0 ? [{ url: p.images[0] }] : [];
        return {
          title: `${name} - ${siteName}`,
          description: desc,
          openGraph: { title: name, description: desc, images },
          twitter: { card: "summary_large_image", title: name, description: desc, images: images.map((i: any) => i.url) },
          alternates: { canonical: `/${locale}/products/${slug}` },
        };
      }
    }
  } catch {}

  const fallbackTitle = locale === "ar" ? "منتج - سيتي تولز" : "Product - City Tools";
  return {
    title: fallbackTitle,
    alternates: { canonical: `/${locale}/products/${slug}` },
  };
}

export default function Page(props: any) {
  return <ProductDetailView {...props} />;
}
