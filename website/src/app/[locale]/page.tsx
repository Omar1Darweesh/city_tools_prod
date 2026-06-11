import { getTranslations } from "next-intl/server";
import HomeView from "./view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  return {
    description: t("heroSubtitle"),
    openGraph: {
      title: t("heroTitle"),
      description: t("heroSubtitle"),
    },
    alternates: { canonical: `/${locale}` },
  };
}

export default function Page(props: any) {
  return <HomeView {...props} />;
}
