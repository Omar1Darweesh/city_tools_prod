import { getTranslations } from "next-intl/server";
import ProductsView from "./view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Products" });
  const title = t("title");
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";
  return {
    title: `${title} - ${siteName}`,
    description: locale === "ar" ? "تصفح جميع المنتجات المتاحة في سيتي تولز" : "Browse all products available at City Tools",
    openGraph: { title: `${title} - ${siteName}` },
    alternates: { canonical: `/${locale}/products` },
  };
}

export default function Page(props: any) {
  return <ProductsView {...props} />;
}
