import { getTranslations } from "next-intl/server";
import CartView from "./view";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cart" });
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";
  const title = t("title");
  return {
    title: `${title} - ${siteName}`,
    description: locale === "ar" ? "عربة التسوق الخاصة بك في سيتي تولز" : "Your shopping cart at City Tools",
    robots: { index: false, follow: false },
    openGraph: { title: `${title} - ${siteName}` },
    alternates: { canonical: `${BASE_URL}/${locale}/cart` },
  };
}

export default function Page(props: any) {
  return <CartView {...props} />;
}
