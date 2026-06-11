import { getTranslations } from "next-intl/server";
import SupportView from "./view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";
  return {
    title: locale === "ar" ? `الدعم - ${siteName}` : `Support - ${siteName}`,
    description: locale === "ar" ? "صفحات الدعم والمساعدة في سيتي تولز" : "Support and help pages at City Tools",
    openGraph: { title: locale === "ar" ? `الدعم - ${siteName}` : `Support - ${siteName}` },
    alternates: { canonical: `/${locale}/support` },
  };
}

export default function Page(props: any) {
  return <SupportView {...props} />;
}
