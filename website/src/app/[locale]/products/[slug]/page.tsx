import { cache } from "react";
import { notFound } from "next/navigation";
import ProductDetailView from "./view";
import { fetchStoreProduct } from "@/lib/product";
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_META } from "@/lib/seo";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

const getProduct = cache(fetchStoreProduct);

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const isAr = locale === "ar";
  const siteName = isAr ? "سيتي تولز" : "City Tools";
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const name = isAr ? product.nameAr || product.nameEn : product.nameEn;
  const categoryName = product.category ? (isAr ? product.category.nameAr || product.category.name : product.category.name) : "";
  const brand = product.brand || "";
  const title = `${name} | ${siteName}`;
  const baseDesc = isAr
    ? `اشتر ${name}${brand ? ` من ${brand}` : ""}${categoryName ? ` - ${categoryName}` : ""} بأفضل الأسعار في سيتي تولز. توصيل سريع لجميع أنحاء مصر.`
    : `Buy ${name}${brand ? ` by ${brand}` : ""}${categoryName ? ` - ${categoryName}` : ""} at the best price from City Tools Egypt. Fast delivery nationwide.`;
  const desc = product.description || baseDesc;
  const ogImages =
    product.images.length > 0
      ? product.images.slice(0, 3).map((url) => ({ url, width: 1200, height: 630, alt: name }))
      : [DEFAULT_OG_IMAGE_META];
  const keywords = isAr
    ? [name, brand, categoryName, "سيتي تولز", "أدوات", "مصر"].filter(Boolean)
    : [name, brand, categoryName, "city tools", "tools", "egypt"].filter(Boolean);

  return {
    title,
    description: desc.slice(0, 160),
    keywords,
    openGraph: {
      title,
      description: desc.slice(0, 160),
      url: `${BASE_URL}/${locale}/products/${slug}`,
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc.slice(0, 160),
      images: product.images.length > 0 ? product.images.slice(0, 3) : [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/products/${slug}`,
      languages: {
        en: `${BASE_URL}/en/products/${slug}`,
        ar: `${BASE_URL}/ar/products/${slug}`,
        "x-default": `${BASE_URL}/en/products/${slug}`,
      },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const isAr = locale === "ar";
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const name = isAr ? product.nameAr || product.nameEn : product.nameEn;
  const displayPrice = product.discountPrice ?? product.priceRetail;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: product.description || "",
    sku: product.code,
    mpn: product.code,
    ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
    ...(product.images.length > 0 && { image: product.images }),
    url: `${BASE_URL}/${locale}/products/${slug}`,
    ...(product.category && {
      category: isAr ? product.category.nameAr || product.category.name : product.category.name,
    }),
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/${locale}/products/${slug}`,
      price: displayPrice,
      priceCurrency: "EGP",
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "City Tools", url: BASE_URL },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: `${BASE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: isAr ? "المنتجات" : "Products", item: `${BASE_URL}/${locale}/products` },
      { "@type": "ListItem", position: 3, name, item: `${BASE_URL}/${locale}/products/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ProductDetailView product={product} />
    </>
  );
}
