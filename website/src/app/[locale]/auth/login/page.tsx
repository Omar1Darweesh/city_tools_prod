import { getTranslations } from "next-intl/server";
import LoginView from "./view";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";
  return {
    title: `${t("login")} - ${siteName}`,
    description: locale === "ar" ? "تسجيل الدخول إلى حسابك في سيتي تولز" : "Sign in to your City Tools account",
    robots: { index: false, follow: false },
    alternates: { canonical: `${BASE_URL}/${locale}/auth/login` },
  };
}

export default function Page(props: any) {
  return <LoginView {...props} />;
}
