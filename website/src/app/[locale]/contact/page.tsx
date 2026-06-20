import ContactView from "./view";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const siteName = isAr ? "سيتي تولز" : "City Tools";
  const title = isAr ? `اتصل بنا | ${siteName}` : `Contact Us | ${siteName}`;
  const description = isAr
    ? "تواصل مع فريق سيتي تولز"
    : "Get in touch with the City Tools team";
  return {
    title,
    description,
    openGraph: { title, description, url: `${BASE_URL}/${locale}/contact` },
    alternates: { canonical: `${BASE_URL}/${locale}/contact` },
  };
}

export default function Page() {
  return <ContactView />;
}
