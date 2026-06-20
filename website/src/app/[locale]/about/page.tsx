import AboutView from "./view";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const siteName = isAr ? "سيتي تولز" : "City Tools";
  const title = isAr ? `عن الشركة | ${siteName}` : `About Us | ${siteName}`;
  const description = isAr
    ? "تعرف على سيتي تولز — مدينة العدد للأدوات المهنية في مصر"
    : "Learn about City Tools — professional tools and equipment in Egypt";
  return {
    title,
    description,
    openGraph: { title, description, url: `${BASE_URL}/${locale}/about` },
    alternates: { canonical: `${BASE_URL}/${locale}/about` },
  };
}

export default function Page() {
  return <AboutView />;
}
