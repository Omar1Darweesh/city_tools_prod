import { getTranslations } from "next-intl/server";
import CategoryDetailView from "./view";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";

  try {
    const res = await fetch(`${API_BASE}/store/categories/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const c = json.data || json;
      if (c?.name) {
        const name = locale === "ar" ? c.nameAr || c.name : c.name;
        return {
          title: `${name} - ${siteName}`,
          description: locale === "ar" ? `تصفح منتجات ${name} في سيتي تولز` : `Browse ${name} products at City Tools`,
          openGraph: { title: `${name} - ${siteName}` },
          alternates: { canonical: `/${locale}/categories/${slug}` },
        };
      }
    }
  } catch {}

  return {
    title: locale === "ar" ? `الأقسام - ${siteName}` : `Categories - ${siteName}`,
    alternates: { canonical: `/${locale}/categories/${slug}` },
  };
}

export default function Page(props: any) {
  return <CategoryDetailView {...props} />;
}
