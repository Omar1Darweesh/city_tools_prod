import { getTranslations } from "next-intl/server";
import ProductsView from "./view";
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_META } from "@/lib/seo";

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
      images: [{ ...DEFAULT_OG_IMAGE_META, alt: isAr ? "سيتي تولز - المنتجات" : "City Tools - Products" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE] },
    alternates: { canonical: `${BASE_URL}/${locale}/products` },
  };
}

export default function Page(props: any) {
  return <ProductsView {...props} />;
}
