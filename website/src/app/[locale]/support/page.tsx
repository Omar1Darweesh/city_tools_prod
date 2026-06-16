import { getTranslations } from "next-intl/server";
import SupportView from "./view";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const siteName = isAr ? "سيتي تولز" : "City Tools";
  const title = isAr ? `الدعم والمساعدة | ${siteName}` : `Support & Help | ${siteName}`;
  const description = isAr
    ? "تواصل مع فريق دعم سيتي تولز. نحن هنا للمساعدة في طلباتك واستفساراتك."
    : "Contact City Tools support team. We're here to help with your orders and inquiries.";
  return {
    title,
    description,
    openGraph: { title, description, url: `${BASE_URL}/${locale}/support` },
    alternates: { canonical: `${BASE_URL}/${locale}/support` },
  };
}

export default function Page(props: any) {
  return <SupportView {...props} />;
}
