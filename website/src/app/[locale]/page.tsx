import { getTranslations } from "next-intl/server";
import HomeView from "./view";
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_META } from "@/lib/seo";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const title = isAr
    ? "سيتي تولز | أدوات ومعدات احترافية بأفضل الأسعار في مصر"
    : "City Tools | Professional Tools & Equipment – Best Prices in Egypt";
  const description = isAr
    ? "تسوق في سيتي تولز أفضل الأدوات والمعدات المهنية بأسعار تنافسية. أدوات كهربائية، أدوات يدوية، معدات بناء وأكثر. توصيل سريع لجميع أنحاء مصر."
    : "Shop City Tools for the best professional tools & equipment at competitive prices. Power tools, hand tools, construction equipment and more. Fast delivery across Egypt.";
  return {
    title,
    description,
    keywords: isAr
      ? ["أدوات كهربائية", "أدوات يدوية", "معدات بناء", "سيتي تولز", "أدوات احترافية", "مصر"]
      : ["power tools", "hand tools", "construction equipment", "city tools", "professional tools", "egypt"],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      images: [{ ...DEFAULT_OG_IMAGE_META, alt: isAr ? "سيتي تولز" : "City Tools" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE] },
    alternates: { canonical: `${BASE_URL}/${locale}` },
  };
}

export default function Page(props: any) {
  return <HomeView {...props} />;
}
