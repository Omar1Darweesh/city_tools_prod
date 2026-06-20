import OrdersView from "./view";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const siteName = isAr ? "سيتي تولز" : "City Tools";
  const title = isAr ? `تتبع الطلب | ${siteName}` : `Track Order | ${siteName}`;
  const description = isAr
    ? "تتبع حالة طلبك من سيتي تولز"
    : "Track your City Tools order status";
  return {
    title,
    description,
    openGraph: { title, description, url: `${BASE_URL}/${locale}/orders` },
    alternates: { canonical: `${BASE_URL}/${locale}/orders` },
  };
}

export default function Page() {
  return <OrdersView />;
}
