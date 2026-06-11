"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { FileText, Save, Loader2, CheckCircle, Plus, Trash2, Shield, RotateCcw, Truck, HelpCircle } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

interface SupportContent {
  heroImage: string;
  terms: PageContent;
  privacy: PageContent;
  returns: PageContent;
  shipping: PageContent;
  faq: FaqItem[];
}

const HERO_IMAGES = [
  "/assets/supportPages/111.jpg",
  "/assets/supportPages/222.jpg",
  "/assets/supportPages/333.jpg",
  "/assets/supportPages/444.jpg",
];

const defaultContent: SupportContent = {
  heroImage: HERO_IMAGES[0],
  terms: { en: "", ar: "" },
  privacy: { en: "", ar: "" },
  returns: { en: "", ar: "" },
  shipping: { en: "", ar: "" },
  faq: [],
};

const SECTIONS: { key: keyof SupportContent; icon: React.ReactNode; labelEn: string; labelAr: string }[] = [
  { key: "terms", icon: <FileText className="size-4" />, labelEn: "Terms & Conditions", labelAr: "الشروط والأحكام" },
  { key: "privacy", icon: <Shield className="size-4" />, labelEn: "Privacy Policy", labelAr: "سياسة الخصوصية" },
  { key: "returns", icon: <RotateCcw className="size-4" />, labelEn: "Return Policy", labelAr: "سياسة الاسترداد" },
  { key: "shipping", icon: <Truck className="size-4" />, labelEn: "Shipping Info", labelAr: "الشحن والتوصيل" },
  { key: "faq", icon: <HelpCircle className="size-4" />, labelEn: "FAQ", labelAr: "الأسئلة الشائعة" },
];

export default function AdminSupportPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [content, setContent] = useState<SupportContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<keyof SupportContent>("terms");

  useEffect(() => {
    adminApi
      .getSupportPages()
      .then((res: any) => {
        if (res) {
          setContent({
            heroImage: res.heroImage || HERO_IMAGES[0],
            terms: res.terms || { en: "", ar: "" },
            privacy: res.privacy || { en: "", ar: "" },
            returns: res.returns || { en: "", ar: "" },
            shipping: res.shipping || { en: "", ar: "" },
            faq: res.faq || [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await adminApi.updateSupportPages(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const setHeroImage = (img: string) =>
    setContent((prev) => ({ ...prev, heroImage: img }));

  const updatePageContent = (key: "terms" | "privacy" | "returns" | "shipping", lang: "en" | "ar", value: string) =>
    setContent((prev) => ({
      ...prev,
      [key]: { ...prev[key], [lang]: value },
    }));

  const addFaq = () =>
    setContent((prev) => ({
      ...prev,
      faq: [...prev.faq, { questionEn: "", questionAr: "", answerEn: "", answerAr: "" }],
    }));

  const updateFaq = (index: number, field: keyof FaqItem, value: string) =>
    setContent((prev) => {
      const faq = [...prev.faq];
      faq[index] = { ...faq[index], [field]: value };
      return { ...prev, faq };
    });

  const removeFaq = (index: number) =>
    setContent((prev) => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index),
    }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {isRtl ? "صفحات الدعم" : "Support Pages"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRtl ? "إدارة محتوى صفحات الشروط والخصوصية والاسترداد والشحن والأسئلة الشائعة" : "Manage Terms, Privacy, Returns, Shipping & FAQ content"}
          </p>
        </div>
      </div>

      {/* Hero Background Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            {isRtl ? "صورة الخلفية" : "Hero Background"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {HERO_IMAGES.map((img) => (
              <button
                key={img}
                onClick={() => setHeroImage(img)}
                className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                  content.heroImage === img
                    ? "border-primary ring-2 ring-primary/30 scale-105"
                    : "border-border hover:border-muted-foreground/30"
                }`}
                style={{ width: 120, height: 72 }}
              >
                <img src={img} alt="" className="size-full object-cover" />
                {content.heroImage === img && (
                  <div className="absolute inset-0 bg-primary/10" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeSection === sec.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {sec.icon}
            {isRtl ? sec.labelAr : sec.labelEn}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeSection === "faq" ? (
          /* ── FAQ ── */
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {isRtl ? "الأسئلة الشائعة" : "FAQ"}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addFaq}>
                <Plus className="size-3.5" />
                {isRtl ? "إضافة سؤال" : "Add Question"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {content.faq.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "لا توجد أسئلة. أضف سؤالاً جديداً." : "No questions yet. Add a new one."}
                </p>
              )}
              {content.faq.map((item, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{isRtl ? `سؤال ${i + 1}` : `Question ${i + 1}`}</span>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeFaq(i)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">{isRtl ? "السؤال (إنجليزي)" : "Question (English)"}</Label>
                      <textarea
                        value={item.questionEn}
                        onChange={(e) => updateFaq(i, "questionEn", e.target.value)}
                        rows={2}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{isRtl ? "السؤال (عربي)" : "Question (Arabic)"}</Label>
                      <textarea
                        value={item.questionAr}
                        onChange={(e) => updateFaq(i, "questionAr", e.target.value)}
                        rows={2}
                        dir="rtl"
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">{isRtl ? "الإجابة (إنجليزي)" : "Answer (English)"}</Label>
                      <textarea
                        value={item.answerEn}
                        onChange={(e) => updateFaq(i, "answerEn", e.target.value)}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{isRtl ? "الإجابة (عربي)" : "Answer (Arabic)"}</Label>
                      <textarea
                        value={item.answerAr}
                        onChange={(e) => updateFaq(i, "answerAr", e.target.value)}
                        rows={3}
                        dir="rtl"
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          /* ── Text pages (terms, privacy, returns, shipping) ── */
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isRtl
                  ? SECTIONS.find((s) => s.key === activeSection)?.labelAr
                  : SECTIONS.find((s) => s.key === activeSection)?.labelEn}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>{isRtl ? "المحتوى (إنجليزي)" : "Content (English)"}</Label>
                <textarea
                  value={(content[activeSection] as PageContent).en}
                  onChange={(e) => updatePageContent(activeSection as "terms" | "privacy" | "returns" | "shipping", "en", e.target.value)}
                  rows={14}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
              <div className="space-y-2">
                <Label>{isRtl ? "المحتوى (عربي)" : "Content (Arabic)"}</Label>
                <textarea
                  value={(content[activeSection] as PageContent).ar}
                  onChange={(e) => updatePageContent(activeSection as "terms" | "privacy" | "returns" | "shipping", "ar", e.target.value)}
                  rows={14}
                  dir="rtl"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="rounded-full px-8">
            {saving ? (
              <><Loader2 className="size-4 animate-spin" /> {isRtl ? "جاري الحفظ..." : "Saving..."}</>
            ) : (
              <><Save className="size-4" /> {isRtl ? "حفظ الكل" : "Save All"}</>
            )}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle className="size-4" />
              {isRtl ? "تم الحفظ" : "Saved"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
