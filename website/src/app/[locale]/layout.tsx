import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { CartProvider } from "@/components/cart/cart-context";
import { LocaleUpdater } from "@/components/layout/locale-updater";
import StoreShell from "@/components/layout/store-shell";
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_META } from "@/lib/seo";

type Locale = "en" | "ar";

const locales = ["en", "ar"] as const;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  const isAr = locale === "ar";
  const siteName = isAr ? "سيتي تولز" : "City Tools";
  const title = isAr ? "سيتي تولز | أدوات ومعدات احترافية بمصر" : "City Tools | Professional Tools & Equipment in Egypt";
  const description = isAr
    ? "سيتي تولز - مصدرك الموثوق للأدوات والمعدات المهنية في مصر. تسوق الآن بأفضل الأسعار مع توصيل سريع."
    : "City Tools – Egypt's trusted store for professional tools & equipment. Shop now for the best prices with fast delivery.";

  const languages: Record<string, string> = {
    "x-default": `${BASE_URL}/en`,
    en: `${BASE_URL}/en`,
    ar: `${BASE_URL}/ar`,
  };

  const titleTemplate = isAr ? `%s | ${siteName}` : `%s | ${siteName}`;

  return {
    metadataBase: new URL(BASE_URL),
    title: { default: title, template: titleTemplate },
    description,
    keywords: isAr
      ? ["أدوات", "معدات", "أدوات مهنية", "سيتي تولز", "مصر", "أدوات كهربائية", "معدات بناء"]
      : ["tools", "equipment", "professional tools", "city tools", "egypt", "power tools", "hand tools", "construction equipment"],
    authors: [{ name: "City Tools", url: BASE_URL }],
    creator: "City Tools",
    publisher: "City Tools",
    icons: {
      icon: "/assets/CT Logo.png",
      apple: "/assets/CT Logo.png",
      shortcut: "/assets/CT Logo.png",
    },
    manifest: "/manifest.json",
    alternates: { languages },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      siteName,
      locale: isAr ? "ar_EG" : "en_US",
      alternateLocale: isAr ? "en_US" : "ar_EG",
      type: "website",
      images: [DEFAULT_OG_IMAGE_META],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    verification: {},
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "City Tools",
    alternateName: "سيتي تولز",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/assets/CT Logo.png`,
      width: 512,
      height: 512,
    },
    description: "Egypt's trusted source for professional tools & equipment. سيتي تولز - مصدرك الموثوق للأدوات والمعدات المهنية في مصر.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "EG",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["Arabic", "English"],
      },
    ],
    sameAs: [
      "https://www.facebook.com/citytools",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: `${BASE_URL}/${locale}`,
    inLanguage: locale === "ar" ? "ar-EG" : "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/${locale}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteName,
    alternateName: locale === "ar" ? "City Tools" : "سيتي تولز",
    url: `${BASE_URL}/${locale}`,
    image: `${BASE_URL}/assets/CT Logo.png`,
    description: locale === "ar"
      ? "سيتي تولز - مصدرك الموثوق للأدوات والمعدات المهنية في مصر"
      : "City Tools – Egypt's trusted store for professional tools & equipment",
    address: { "@type": "PostalAddress", addressCountry: "EG" },
    priceRange: "$$",
    currenciesAccepted: "EGP",
    paymentAccepted: "Cash, Credit Card",
  };

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema, storeSchema]),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased overflow-x-hidden">
        <LocaleUpdater locale={locale} />
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <SessionProvider>
              <CartProvider>
                <StoreShell>{children}</StoreShell>
              </CartProvider>
            </SessionProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
