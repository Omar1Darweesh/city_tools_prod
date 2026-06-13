"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { MapPin, Phone, Mail, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

interface SocialLink {
  label: string;
  url: string;
  icon: string;
}

interface WorkingHour {
  dayEn: string;
  dayAr: string;
  hoursEn: string;
  hoursAr: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const DEFAULT_EMAIL = "info@citytools.sa";
const DEFAULT_PHONE = "+966 50 000 0000";
const DEFAULT_ADDRESS_EN = "Cairo, Egypt";
const DEFAULT_ADDRESS_AR = "القاهرة، مصر";
const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { label: "Facebook", url: "#", icon: "facebook" },
  { label: "Instagram", url: "#", icon: "instagram" },
  { label: "YouTube", url: "#", icon: "youtube" },
  { label: "X (Twitter)", url: "#", icon: "x" },
];
const DEFAULT_WORKING_HOURS: WorkingHour[] = [
  { dayEn: "Sat–Thu", dayAr: "السبت – الخميس", hoursEn: "9:00 AM – 9:00 PM", hoursAr: "9:00 ص – 9:00 م" },
  { dayEn: "Friday", dayAr: "الجمعة", hoursEn: "2:00 PM – 9:00 PM", hoursAr: "2:00 م – 9:00 م" },
];

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  instagram: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  youtube: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M18.73 3.5h3.18l-6.94 7.93L23 20.5h-6.39l-5-6.54-5.73 6.54H2.66l7.42-8.48L2 3.5h6.55l4.52 5.98L18.73 3.5zm-1.12 15.28h1.76L7.38 5.21H5.48l12.13 13.57z"/></svg>,
  tiktok: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  snapchat: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M5.83 4.53c-.34 1.1-.53 2.26-.53 3.47 0 1.18.21 2.29.53 3.36-.74.38-1.21 1.08-1.36 1.91-.04.23-.06.47-.06.7 0 .47.1.93.31 1.35.33.66.87 1.16 1.52 1.45.06.03.12.05.19.08.1.04.19.09.29.12.31.11.65.2 1.03.27.34.08.58.31.66.66.01.04.01.09.02.13.03.33.16.62.35.85.19.24.44.41.72.51.63.23 1.31.26 1.97.13.23-.04.46-.11.68-.21.33-.14.68-.21 1.04-.21s.71.07 1.04.21c.22.09.45.16.68.21.66.13 1.34.1 1.97-.13.28-.1.53-.27.72-.51.19-.24.33-.53.35-.85 0-.04.01-.09.02-.13.08-.35.32-.58.66-.66.37-.07.72-.16 1.03-.27.1-.04.19-.08.29-.12.06-.03.12-.05.19-.08.65-.29 1.19-.8 1.52-1.45.2-.42.31-.88.31-1.35 0-.24-.02-.48-.06-.7-.15-.83-.62-1.53-1.36-1.91.32-1.07.53-2.18.53-3.36 0-1.21-.19-2.37-.53-3.47C19.37 2.91 17.31 2 12 2S4.63 2.91 4.53 4.53z"/></svg>,
  linkedin: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  whatsapp: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  link: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};

export function Footer() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const year = new Date().getFullYear();
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [addressEn, setAddressEn] = useState(DEFAULT_ADDRESS_EN);
  const [addressAr, setAddressAr] = useState(DEFAULT_ADDRESS_AR);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(DEFAULT_SOCIAL_LINKS);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(DEFAULT_WORKING_HOURS);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/store/footer-settings`)
      .then((r) => r.json())
      .then((res: any) => {
        if (res) {
          if (res.email) setEmail(res.email);
          if (res.phone) setPhone(res.phone);
          if (res.addressEn) setAddressEn(res.addressEn);
          if (res.addressAr) setAddressAr(res.addressAr);
          if (res.socialLinks?.length) setSocialLinks(res.socialLinks);
          if (res.workingHours?.length) setWorkingHours(res.workingHours);
        }
      })
      .catch(() => {});
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer dir={isRtl ? "rtl" : "ltr"} style={{ background: "#111111", color: "#ffffff" }}>

      {/* Red accent top bar */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #C0161B 0%, #e83030 50%, #C0161B 100%)" }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="space-y-5 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block hover:opacity-75 transition-opacity">
              <Image
                src="/assets/CT Logo.png"
                alt="City Tools - مدينة العدد"
                width={180}
                height={72}
                className="object-contain brightness-0 invert"
                style={{ width: "auto", height: "auto" }}
              />
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
              {isRtl
                ? "مدينة العدد — وجهتك الأولى للأدوات المهنية والمعدات الصناعية بأعلى معايير الجودة في مصر."
                : "City Tools — Your #1 destination for professional tools & industrial equipment across Egypt."}
            </p>

            {/* Social Icons */}
            <div className="flex gap-2 pt-1 flex-wrap">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-full transition-all hover:scale-110 hover:bg-red-700"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  {SOCIAL_ICONS[s.icon] || SOCIAL_ICONS.link}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#C0161B" }}>
              {isRtl ? "روابط سريعة" : "Quick Links"}
            </h3>
            <div style={{ width: 32, height: 2, background: "#C0161B", borderRadius: 2 }} />
            <nav className="flex flex-col gap-2.5">
              {[
                { href: "/products",   ar: "المنتجات",        en: "Products" },
                { href: "/categories", ar: "الأقسام",         en: "Categories" },
                { href: "/brands",     ar: "الماركات",        en: "Brands" },
                { href: "/about",      ar: "عن الشركة",       en: "About Us" },
                { href: "/contact",    ar: "اتصل بنا",        en: "Contact Us" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm transition-all hover:text-[#C0161B] hover:bg-black/30 rounded-lg px-2 -mx-2 py-1.5 flex items-center gap-2 group text-white/60"
                >
                  <span
                    className="inline-block size-1.5 rounded-full transition-all duration-300 group-hover:bg-red-500 group-hover:scale-125"
                    style={{ background: "rgba(192,22,27,0.6)", flexShrink: 0 }}
                  />
                  {isRtl ? l.ar : l.en}
                </Link>
              ))}
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#C0161B" }}>
              {isRtl ? "الدعم" : "Support"}
            </h3>
            <div style={{ width: 32, height: 2, background: "#C0161B", borderRadius: 2 }} />
            <nav className="flex flex-col gap-2.5">
              {[
                { href: "/support?tab=terms",   ar: "الشروط والأحكام",    en: "Terms & Conditions" },
                { href: "/support?tab=privacy", ar: "سياسة الخصوصية",    en: "Privacy Policy" },
                { href: "/support?tab=returns", ar: "سياسة الاسترداد",   en: "Return Policy" },
                { href: "/support?tab=shipping", ar: "الشحن والتوصيل",   en: "Shipping Info" },
                { href: "/support?tab=faq",     ar: "الأسئلة الشائعة",   en: "FAQ" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm transition-all hover:text-[#C0161B] hover:bg-black/30 rounded-lg px-2 -mx-2 py-1.5 flex items-center gap-2 group text-white/60"
                >
                  <span
                    className="inline-block size-1.5 rounded-full transition-all duration-300 group-hover:bg-red-500 group-hover:scale-125"
                    style={{ background: "rgba(192,22,27,0.6)", flexShrink: 0 }}
                  />
                  {isRtl ? l.ar : l.en}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#C0161B" }}>
              {isRtl ? "تواصل معنا" : "Contact Us"}
            </h3>
            <div style={{ width: 32, height: 2, background: "#C0161B", borderRadius: 2 }} />
            <div className="flex flex-col gap-4">
              <a
                href={`mailto:${email}`}
                className="flex items-start gap-3 text-sm group transition-all hover:text-[#C0161B] hover:bg-black/30 rounded-lg px-2 -mx-2 py-1.5 duration-300 text-white/60"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: "rgba(192,22,27,0.15)", border: "1px solid rgba(192,22,27,0.25)" }}
                >
                  <Mail className="size-3.5" style={{ color: "#C0161B" }} />
                </span>
                <span className="break-all">{email}</span>
              </a>

              <a
                href={`tel:${phone}`}
                className="flex items-start gap-3 text-sm group transition-all hover:text-[#C0161B] hover:bg-black/30 rounded-lg px-2 -mx-2 py-1.5 duration-300 text-white/60"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: "rgba(192,22,27,0.15)", border: "1px solid rgba(192,22,27,0.25)" }}
                >
                  <Phone className="size-3.5" style={{ color: "#C0161B" }} />
                </span>
                <span dir="ltr">{phone}</span>
              </a>

              <div
                className="flex items-start gap-3 text-sm"
                style={{ color: "rgba(255,255,255,0.60)" }}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  style={{ background: "rgba(192,22,27,0.15)", border: "1px solid rgba(192,22,27,0.25)" }}
                >
                  <MapPin className="size-3.5" style={{ color: "#C0161B" }} />
                </span>
                <span>{isRtl ? addressAr : addressEn}</span>
              </div>

              {/* Working Hours */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "rgba(255,255,255,0.55) "}}>
                {workingHours.map((wh) => (
                  <span key={wh.dayEn}>
                    <span className="font-semibold">{isRtl ? wh.dayAr : wh.dayEn}</span>
                    <span> {isRtl ? wh.hoursAr : wh.hoursEn}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs text-center sm:text-start" style={{ color: "rgba(255,255,255,0.40)" }}>
            © {year} City Tools —{" "}
            {isRtl ? "مدينة العدد. جميع الحقوق محفوظة." : "All rights reserved."}
          </p>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold tracking-wide" style={{ color: "#C0161B" }}>
              {isRtl ? "مدعوم بواسطة SAHLAA.AI" : "Powered by SAHLAA.AI"}
            </span>
            <div className="group relative shrink-0">
              <Image
                src="/assets/sahlaa-ai-logo.jpeg"
                alt="SAHLAA.AI"
                width={120}
                height={40}
                className="h-8 w-auto rounded-md object-contain cursor-default"
              />
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
                style={{ background: "#C0161B" }}
              >
                SAHLAA.AI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 end-6 z-50 flex size-10 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
          style={{ background: "#C0161B", color: "#fff" }}
        >
          <ArrowUp className="size-4" />
        </button>
      )}
    </footer>
  );
}
