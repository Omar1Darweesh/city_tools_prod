import { getTranslations } from "next-intl/server";
import CategoriesView from "./view";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";
  const title = locale === "ar" ? `الأقسام - ${siteName}` : `Categories - ${siteName}`;
  const description = locale === "ar" ? "تصفح جميع الأقسام والفئات في سيتي تولز" : "Browse all categories at City Tools";
  return {
    title,
    description,
    openGraph: { title, description, url: `${BASE_URL}/${locale}/categories` },
    alternates: {
      canonical: `${BASE_URL}/${locale}/categories`,
      languages: {
        en: `${BASE_URL}/en/categories`,
        ar: `${BASE_URL}/ar/categories`,
        "x-default": `${BASE_URL}/en/categories`,
      },
    },
  };
}

export default function Page(props: any) {
  return <CategoriesView {...props} />;
}
