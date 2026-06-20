import BrandsView from "./view";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";
  const title =
    locale === "ar" ? `الماركات - ${siteName}` : `Brands - ${siteName}`;
  const description =
    locale === "ar"
      ? "تصفح جميع الماركات العالمية المعتمدة في سيتي تولز"
      : "Browse all trusted global brands at City Tools";
  return {
    title,
    description,
    openGraph: { title, description, url: `${BASE_URL}/${locale}/brands` },
    alternates: {
      canonical: `${BASE_URL}/${locale}/brands`,
      languages: {
        en: `${BASE_URL}/en/brands`,
        ar: `${BASE_URL}/ar/brands`,
        "x-default": `${BASE_URL}/en/brands`,
      },
    },
  };
}

export default function Page() {
  return <BrandsView />;
}
