"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { Shield, FileText, RotateCcw, Truck, HelpCircle, Loader2, ChevronDown } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface FaqItem {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
}

interface PageContent {
  en: string;
  ar: string;
}

interface SupportData {
  heroImage: string;
  terms: PageContent;
  privacy: PageContent;
  returns: PageContent;
  shipping: PageContent;
  faq: FaqItem[];
}

const DEFAULT_CONTENT: SupportData = {
  heroImage: "/assets/supportPages/111.jpg",
  terms: { en: "", ar: "" },
  privacy: { en: "", ar: "" },
  returns: { en: "", ar: "" },
  shipping: { en: "", ar: "" },
  faq: [],
};

const TABS = [
  { id: "terms", icon: <FileText className="size-4" />, labelEn: "Terms & Conditions", labelAr: "الشروط والأحكام", gradient: "from-red-600 to-red-700" },
  { id: "privacy", icon: <Shield className="size-4" />, labelEn: "Privacy Policy", labelAr: "سياسة الخصوصية", gradient: "from-blue-600 to-blue-700" },
  { id: "returns", icon: <RotateCcw className="size-4" />, labelEn: "Return Policy", labelAr: "سياسة الاسترداد", gradient: "from-emerald-600 to-emerald-700" },
  { id: "shipping", icon: <Truck className="size-4" />, labelEn: "Shipping Info", labelAr: "الشحن والتوصيل", gradient: "from-amber-600 to-amber-700" },
  { id: "faq", icon: <HelpCircle className="size-4" />, labelEn: "FAQ", labelAr: "الأسئلة الشائعة", gradient: "from-purple-600 to-purple-700" },
];

function FaqAccordion({ items, isRtl }: { items: FaqItem[]; isRtl: boolean }) {
  const [open, setOpen] = useState<number | null>(null);

  if (!items || items.length === 0) {
    return <p className="text-muted-foreground text-sm">{isRtl ? "لا توجد أسئلة بعد." : "No questions yet."}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const question = isRtl ? item.questionAr : item.questionEn;
        const answer = isRtl ? item.answerAr : item.answerEn;
        if (!question && !answer) return null;
        return (
          <div
            key={i}
            className="rounded-xl border bg-card overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-muted/50 transition-colors"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <span className="font-medium text-foreground">{question}</span>
              <ChevronDown
                className={`size-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
                  open === i ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                open === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed" dir={isRtl ? "rtl" : "ltr"}>
                {answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderPlainText(text: string) {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    const isHeading = /^\d+[\.\-\u0600-\u06FF]/.test(trimmed);
    if (isHeading) {
      const [title, ...rest] = trimmed.split(/\n/);
      return (
        <div key={i} className="mb-4">
          <h4 className="font-semibold text-foreground mb-1.5">{title}</h4>
          {rest.length > 0 && <p className="text-muted-foreground leading-relaxed">{rest.join("\n")}</p>}
        </div>
      );
    }
    return <p key={i} className="text-muted-foreground leading-relaxed mb-4 last:mb-0">{trimmed}</p>;
  });
}

function SupportContent() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<SupportData>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/store/support-pages`)
      .then((r) => r.json())
      .then((res: any) => {
        if (res) {
          setData({
            heroImage: res.heroImage || DEFAULT_CONTENT.heroImage,
            terms: res.terms || DEFAULT_CONTENT.terms,
            privacy: res.privacy || DEFAULT_CONTENT.privacy,
            returns: res.returns || DEFAULT_CONTENT.returns,
            shipping: res.shipping || DEFAULT_CONTENT.shipping,
            faq: res.faq || [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeTab = searchParams.get("tab") || "terms";
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  const setTab = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const currentContent = data[activeTab as keyof SupportData];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Header */}
      <section className="relative overflow-hidden" style={{ minHeight: "420px" }}>
        <Image
          src={data.heroImage}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0f1923] via-[#1a2535] to-[#0f1923]"
          style={{ opacity: 0.75 }}
        />
        <div className="absolute top-10 end-10 size-64 rounded-full opacity-10 animate-float" style={{ background: "radial-gradient(circle, #C0161B, transparent)" }} />
        <div className="absolute bottom-0 start-20 size-40 rounded-full opacity-10 animate-float-delayed" style={{ background: "radial-gradient(circle, #C0161B, transparent)" }} />
        <div className="absolute top-1/2 start-1/2 size-24 border border-white/10 rounded-2xl rotate-45 animate-pulse-slow" />

        <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 py-20 sm:py-28 flex items-center" style={{ minHeight: "420px" }}>
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
              {isRtl ? currentTab.labelAr : currentTab.labelEn}
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed">
              {isRtl
                ? "جميع المعلومات التي تحتاجها في مكان واحد"
                : "Everything you need to know in one place"}
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="flex flex-wrap gap-2 justify-center mb-10" dir={isRtl ? "rtl" : "ltr"}>
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                    : "bg-card text-muted-foreground hover:bg-muted border border-border/50 hover:border-border"
                }`}
              >
                {tab.icon}
                {isRtl ? tab.labelAr : tab.labelEn}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeTab === "faq" ? (
          <div className="pb-16">
            <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-purple-500" />
                {isRtl ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
              </h2>
              <FaqAccordion items={(currentContent as FaqItem[]) || []} isRtl={isRtl} />
            </div>
          </div>
        ) : (
          <div className="pb-16">
            <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-primary" />
                {isRtl ? currentTab.labelAr : currentTab.labelEn}
              </h2>
              <div dir={isRtl ? "rtl" : "ltr"}>
                {renderPlainText((currentContent as PageContent)?.[isRtl ? "ar" : "en"] || "")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SupportContent />
    </Suspense>
  );
}
