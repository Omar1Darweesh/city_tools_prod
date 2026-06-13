import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { CartProvider } from "@/components/cart/cart-context";
import { LocaleUpdater } from "@/components/layout/locale-updater";
import StoreShell from "@/components/layout/store-shell";

type Locale = "en" | "ar";

const locales = ["en", "ar"] as const;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://citytools-eg.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  const title = t("heroTitle");
  const description = t("heroSubtitle");
  const siteName = locale === "ar" ? "سيتي تولز" : "City Tools";

  const alternates: Record<string, string> = {
    canonical: `${BASE_URL}/${locale}`,
  };
  for (const alt of locales) {
    alternates[alt === locale ? "x-default" : alt] = `${BASE_URL}/${alt}`;
  }

  const titleTemplate = locale === "ar" ? `${siteName} - %s` : `%s - ${siteName}`;

  return {
    title: { default: siteName, template: titleTemplate },
    description,
    icons: { icon: "/icon.png", apple: "/icon.png" },
    alternates: { languages: alternates },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      siteName,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: locale === "ar" ? "en_US" : "ar_EG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
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
    logo: `${BASE_URL}/icon.png`,
    description: "Your Trusted Source for Professional Tools & Equipment in Egypt",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+20-XXX-XXX-XXXX",
      contactType: "customer service",
    },
    sameAs: [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: `${BASE_URL}/${locale}`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/${locale}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
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
