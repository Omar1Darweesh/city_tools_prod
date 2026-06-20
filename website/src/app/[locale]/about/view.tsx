"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Wrench, Truck, Shield, Users } from "lucide-react";

export default function AboutView() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const title = isRtl ? "عن سيتي تولز" : "About City Tools";
  const subtitle = isRtl
    ? "مدينة العدد — وجهتك الأولى للأدوات المهنية والمعدات الصناعية في مصر"
    : "City of Tools — Egypt's trusted destination for professional tools and industrial equipment";

  const points = [
    {
      icon: Wrench,
      titleEn: "Genuine Products",
      titleAr: "منتجات أصلية",
      descEn: "Power tools, hand tools, and equipment from trusted global brands.",
      descAr: "أدوات كهربائية ويدوية ومعدات من ماركات عالمية موثوقة.",
    },
    {
      icon: Truck,
      titleEn: "Fast Delivery",
      titleAr: "توصيل سريع",
      descEn: "Delivery across Cairo, Giza, and major cities in Egypt.",
      descAr: "توصيل داخل القاهرة والجيزة والمدن الرئيسية في مصر.",
    },
    {
      icon: Shield,
      titleEn: "Quality & Warranty",
      titleAr: "جودة وضمان",
      descEn: "We stand behind every product we sell with expert support.",
      descAr: "نضمن جودة كل منتج مع دعم فني متخصص.",
    },
    {
      icon: Users,
      titleEn: "Wholesale & Retail",
      titleAr: "جملة وتجزئة",
      descEn: "Competitive prices for contractors, workshops, and individual buyers.",
      descAr: "أسعار تنافسية للمقاولين والورش والأفراد.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <p className="mb-2 text-sm font-medium text-[#C0161B]">
          {isRtl ? "من نحن" : "Who we are"}
        </p>
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mb-10 text-lg text-white/70">{subtitle}</p>

        <div className="grid gap-6 sm:grid-cols-2">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.titleEn}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <Icon className="mb-3 size-8 text-[#C0161B]" />
                <h2 className="mb-2 text-lg font-semibold">
                  {isRtl ? p.titleAr : p.titleEn}
                </h2>
                <p className="text-sm text-white/65">
                  {isRtl ? p.descAr : p.descEn}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/products"
            className="rounded-lg bg-[#C0161B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#a01216]"
          >
            {isRtl ? "تسوق الآن" : "Shop now"}
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold hover:bg-white/5"
          >
            {isRtl ? "اتصل بنا" : "Contact us"}
          </Link>
        </div>
      </div>
    </div>
  );
}
