import TypesView from "./view";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";
  const title = locale === "ar" ? `الفئات - ${siteName}` : `Product Types - ${siteName}`;
  const description =
    locale === "ar"
      ? "تصفح جميع الفئات: يدوي، كهربائي، اكسسوارات وأكثر في سيتي تولز"
      : "Browse all product types at City Tools: manual, electric, accessories and more";
  return {
    title,
    description,
    openGraph: { title, description, url: `${BASE_URL}/${locale}/types` },
    alternates: {
      canonical: `${BASE_URL}/${locale}/types`,
      languages: {
        en: `${BASE_URL}/en/types`,
        ar: `${BASE_URL}/ar/types`,
        "x-default": `${BASE_URL}/en/types`,
      },
    },
  };
}

export default function Page() {
  return <TypesView />;
}
