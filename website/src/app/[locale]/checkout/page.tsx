import { getTranslations } from "next-intl/server";
import CheckoutView from "./view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Checkout" });
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";
  const title = t("title");
  return {
    title: `${title} - ${siteName}`,
    description: locale === "ar" ? "إتمام عملية الشراء في سيتي تولز" : "Complete your purchase at City Tools",
    openGraph: { title: `${title} - ${siteName}` },
    alternates: { canonical: `/${locale}/checkout` },
  };
}

export default function Page(props: any) {
  return <CheckoutView {...props} />;
}
