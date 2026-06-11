import { getTranslations } from "next-intl/server";
import CategoriesView from "./view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";
  return {
    title: locale === "ar" ? `الأقسام - ${siteName}` : `Categories - ${siteName}`,
    description: locale === "ar" ? "تصفح جميع الأقسام والفئات في سيتي تولز" : "Browse all categories at City Tools",
    openGraph: { title: locale === "ar" ? "الأقسام - سيتي تولز" : "Categories - City Tools" },
    alternates: { canonical: `/${locale}/categories` },
  };
}

export default function Page(props: any) {
  return <CategoriesView {...props} />;
}
