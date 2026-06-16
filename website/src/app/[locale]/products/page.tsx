import { getTranslations } from "next-intl/server";
import ProductsView from "./view";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const title = isAr
    ? "جميع المنتجات | سيتي تولز"
    : "All Products | City Tools";
  const description = isAr
    ? "تصفح مجموعتنا الكاملة من الأدوات والمعدات المهنية في سيتي تولز. أدوات كهربائية، يدوية، معدات بناء وأكثر."
    : "Browse our full range of professional tools and equipment at City Tools. Power tools, hand tools, construction equipment and more.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/products`,
      images: [{ url: "/assets/CT Logo.png", width: 1200, height: 630, alt: isAr ? "سيتي تولز - المنتجات" : "City Tools - Products" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/assets/CT Logo.png"] },
    alternates: { canonical: `${BASE_URL}/${locale}/products` },
  };
}

export default function Page(props: any) {
  return <ProductsView {...props} />;
}
