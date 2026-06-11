"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react";
import { ArrowLeft, Save, Percent } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

const destinationOptions = [
  { value: "/products", labelEn: "All Products", labelAr: "جميع المنتجات" },
  { value: "/products?categoryId=1", labelEn: "Power Tools Category", labelAr: "قسم الأدوات الكهربائية" },
  { value: "/products?categoryId=2", labelEn: "Hand Tools Category", labelAr: "قسم العدد اليدوية" },
  { value: "/products?categoryId=3", labelEn: "Electrical Category", labelAr: "قسم الكهربائيات" },
  { value: "/products?categoryId=4", labelEn: "Plumbing Category", labelAr: "قسم السباكة" },
  { value: "/products?categoryId=5", labelEn: "Safety Category", labelAr: "قسم السلامة" },
  { value: "/products?categoryId=6", labelEn: "Industrial Category", labelAr: "قسم الصناعية" },
  { value: "/categories", labelEn: "All Categories", labelAr: "جميع الأقسام" },
  { value: "/brands", labelEn: "Brands Page", labelAr: "صفحة الماركات" },
  { value: "/", labelEn: "Homepage", labelAr: "الصفحة الرئيسية" },
];

const bgColorOptions = [
  { value: "linear-gradient(135deg, #0f1923 0%, #1a2535 40%, #C0161B 100%)", labelEn: "Dark with Red Accent", labelAr: "داكن مع أحمر", demo: "#0f1923" },
  { value: "linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 50%, #4a90d9 100%)", labelEn: "Blue Gradient", labelAr: "تدرج أزرق", demo: "#1e3a5f" },
  { value: "linear-gradient(135deg, #0a2e1f 0%, #1a4a32 40%, #2d8a5e 100%)", labelEn: "Green Gradient", labelAr: "تدرج أخضر", demo: "#0a2e1f" },
  { value: "linear-gradient(135deg, #2d1b4e 0%, #4a2d7a 40%, #8b5cf6 100%)", labelEn: "Purple Gradient", labelAr: "تدرج بنفسجي", demo: "#2d1b4e" },
  { value: "linear-gradient(135deg, #4a1a1a 0%, #7a2d2d 40%, #ef4444 100%)", labelEn: "Red Gradient", labelAr: "تدرج أحمر", demo: "#4a1a1a" },
  { value: "linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 40%, #6a6a6a 100%)", labelEn: "Dark Gray", labelAr: "رمادي داكن", demo: "#1a1a1a" },
];

export default function NewDiscountCardPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    badgeEn: "Limited Offer", badgeAr: "عرض محدود",
    titleEn: "", titleAr: "",
    descEn: "", descAr: "",
    linkUrl: "/products", linkLabelEn: "Shop Now", linkLabelAr: "تسوق الآن",
    bgColor: "linear-gradient(135deg, #0f1923 0%, #1a2535 40%, #C0161B 100%)",
    isActive: true,
  });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminApi.createDiscountCard(form);
      router.push("/admin/discount-cards");
    } catch (err: any) {
      setError(err.message || (isRtl ? "حدث خطأ ما" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cf-root">
      <div className="cf-header">
        <Link href="/admin/discount-cards" className="cf-back">
          <ArrowLeft className="size-4" />
          {isRtl ? "العودة لبطاقات الخصم" : "Back to Discount Cards"}
        </Link>
        <div className="cf-title-row">
          <div className="cf-title-icon" style={{ background: "linear-gradient(135deg, #C0161B, #e83030)" }}>
            <Percent className="size-5 text-white" />
          </div>
          <div>
            <h1 className="cf-title">{isRtl ? "إضافة بطاقة خصم" : "Add New Discount Card"}</h1>
            <p className="cf-sub">{isRtl ? "أنشئ بطاقة عرض جديدة للصفحة الرئيسية" : "Create a new promo banner for the homepage"}</p>
          </div>
        </div>
      </div>

      {error && <div className="cf-error">{error}</div>}

      <form onSubmit={handleSubmit} className="cf-form">
        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "النصوص" : "Text Content"}</h2>
          <div className="cf-grid-2">
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "شارة (إنجليزي)" : "Badge (English)"}</label>
              <input className="cf-input" value={form.badgeEn} onChange={e => set("badgeEn", e.target.value)} placeholder="Limited Offer" />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "شارة (عربي)" : "Badge (Arabic)"}</label>
              <input className="cf-input" value={form.badgeAr} onChange={e => set("badgeAr", e.target.value)} dir="rtl" placeholder="عرض محدود" />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "العنوان (إنجليزي)" : "Title (English)"} <span className="cf-req">*</span></label>
              <input className="cf-input" value={form.titleEn} onChange={e => set("titleEn", e.target.value)} required placeholder="e.g. 20% Off Electrical Tools" />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "العنوان (عربي)" : "Title (Arabic)"} <span className="cf-req">*</span></label>
              <input className="cf-input" value={form.titleAr} onChange={e => set("titleAr", e.target.value)} required dir="rtl" placeholder="مثال: خصم 20% على الأدوات الكهربائية" />
            </div>
            <div className="cf-field cf-field-full">
              <label className="cf-label">{isRtl ? "الوصف (إنجليزي)" : "Description (English)"} <span className="cf-req">*</span></label>
              <textarea className="cf-input cf-textarea" value={form.descEn} onChange={e => set("descEn", e.target.value)} required rows={2} placeholder="Exclusive discounts on all electrical tools..." />
            </div>
            <div className="cf-field cf-field-full">
              <label className="cf-label">{isRtl ? "الوصف (عربي)" : "Description (Arabic)"} <span className="cf-req">*</span></label>
              <textarea className="cf-input cf-textarea" value={form.descAr} onChange={e => set("descAr", e.target.value)} required rows={2} dir="rtl" placeholder="تخفيضات حصرية على جميع الأدوات الكهربائية..." />
            </div>
          </div>
        </div>

        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "الرابط والإجراء" : "Link & Action"}</h2>
          <div className="cf-grid-2">
            <div className="cf-field cf-field-full">
              <label className="cf-label">{isRtl ? "الصفحة الوجهة" : "Destination Page"} <span className="cf-req">*</span></label>
              <select
                className="cf-input cf-select"
                value={form.linkUrl}
                onChange={e => {
                  const val = e.target.value;
                  set("linkUrl", val);
                  const opt = destinationOptions.find(o => o.value === val);
                  if (opt) {
                    set("linkLabelEn", isRtl ? "تسوق الآن" : "Shop Now");
                    set("linkLabelAr", "تسوق الآن");
                  }
                }}
                required
              >
                {destinationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {isRtl ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
              <p className="cf-field-hint">{isRtl ? "اختر الصفحة التي سينتقل إليها المستخدم عند النقر على البطاقة" : "Choose the page users will go to when clicking the card"}</p>
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "نص الزر (إنجليزي)" : "Button Label (English)"}</label>
              <input className="cf-input" value={form.linkLabelEn} onChange={e => set("linkLabelEn", e.target.value)} placeholder="Shop Now" />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "نص الزر (عربي)" : "Button Label (Arabic)"}</label>
              <input className="cf-input" value={form.linkLabelAr} onChange={e => set("linkLabelAr", e.target.value)} dir="rtl" placeholder="تسوق الآن" />
            </div>
          </div>
        </div>

        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "الألوان" : "Colors"}</h2>
          <div className="cf-grid-2">
            <div className="cf-field cf-field-full">
              <label className="cf-label">{isRtl ? "خلفية البطاقة" : "Card Background"} <span className="cf-req">*</span></label>
              <div className="cf-bg-grid">
                {bgColorOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("bgColor", opt.value)}
                    className={`cf-bg-btn ${form.bgColor === opt.value ? "selected" : ""}`}
                    title={isRtl ? opt.labelAr : opt.labelEn}
                  >
                    <div className="cf-bg-preview" style={{ background: opt.value }} />
                    <span className="cf-bg-label">{isRtl ? opt.labelAr : opt.labelEn}</span>
                    {form.bgColor === opt.value && <span className="cf-bg-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="cf-field cf-field-full">
              <label className="cf-preview-box" style={{ background: form.bgColor, minHeight: "80px", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#e83030", background: "rgba(192,22,27,0.15)", border: "1px solid rgba(192,22,27,0.3)", borderRadius: "999px", padding: "0.15rem 0.5rem", width: "fit-content", marginBottom: "0.5rem" }}>✦ {form.badgeEn}</span>
                <span style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{form.titleEn || "Title"}</span>
              </label>
            </div>
            <div className="cf-field cf-field-full">
              <label className="cf-checkbox-label">
                <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} />
                <span>{isRtl ? "نشط (يظهر في الصفحة الرئيسية)" : "Active (shown on homepage)"}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="cf-actions">
          <button type="submit" disabled={saving} className="cf-save-btn" style={{ background: "#C0161B" }}>
            {saving ? (
              <><div className="cf-btn-spinner" />{isRtl ? "جاري الحفظ..." : "Saving..."}</>
            ) : (
              <><Save className="size-4" />{isRtl ? "حفظ البطاقة" : "Save Card"}</>
            )}
          </button>
          <Link href="/admin/discount-cards" className="cf-cancel-btn">{isRtl ? "إلغاء" : "Cancel"}</Link>
        </div>
      </form>

      <style>{`
        .cf-root { display: flex; flex-direction: column; gap: 1.5rem; max-width: 720px; }
        .cf-header { display: flex; flex-direction: column; gap: 1rem; }
        .cf-back { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.83rem; color: var(--muted-foreground); text-decoration: none; transition: color 0.2s; width: fit-content; }
        .cf-back:hover { color: var(--foreground); }
        .cf-title-row { display: flex; align-items: center; gap: 0.875rem; }
        .cf-title-icon { width: 52px; height: 52px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.2); }
        .cf-title { font-size: 1.5rem; font-weight: 800; }
        .cf-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
        .cf-error { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.25); color: #b91c1c; border-radius: 0.875rem; padding: 0.875rem 1rem; font-size: 0.875rem; font-weight: 500; }
        .cf-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .cf-section { background: var(--card); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.375rem; display: flex; flex-direction: column; gap: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
        .cf-section-title { font-size: 0.875rem; font-weight: 800; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); margin-bottom: 0.25rem; }
        .cf-grid-2 { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
        @media (min-width: 560px) { .cf-grid-2 { grid-template-columns: 1fr 1fr; } }
        .cf-field-full { grid-column: 1 / -1; }
        .cf-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .cf-label { font-size: 0.78rem; font-weight: 700; color: var(--foreground); }
        .cf-req { color: #ef4444; }
        .cf-field-hint { font-size: 0.7rem; color: var(--muted-foreground); margin-top: 0.2rem; }
        .cf-input { background: var(--background); border: 1.5px solid var(--border); border-radius: 0.75rem; padding: 0.6rem 0.875rem; font-size: 0.875rem; color: var(--foreground); font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%; }
        .cf-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(192,22,27,0.12); }
        .cf-select { appearance: auto; cursor: pointer; }
        .cf-textarea { resize: vertical; min-height: 60px; }
        .cf-bg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.625rem; }
        .cf-bg-btn { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 0.625rem; border-radius: 0.75rem; border: 2px solid var(--border); cursor: pointer; background: var(--background); transition: all 0.2s; position: relative; }
        .cf-bg-btn:hover { border-color: var(--muted-foreground); }
        .cf-bg-btn.selected { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(192,22,27,0.15); }
        .cf-bg-preview { width: 100%; height: 48px; border-radius: 0.5rem; }
        .cf-bg-label { font-size: 0.68rem; font-weight: 600; color: var(--muted-foreground); text-align: center; }
        .cf-bg-check { position: absolute; top: 0.35rem; inset-inline-end: 0.35rem; width: 18px; height: 18px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 0.65rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .cf-checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; padding-top: 0.5rem; }
        .cf-checkbox-label input { width: 18px; height: 18px; accent-color: #C0161B; }
        .cf-actions { display: flex; align-items: center; gap: 0.75rem; padding-top: 0.5rem; }
        .cf-save-btn { display: inline-flex; align-items: center; gap: 0.5rem; color: #fff; padding: 0.7rem 1.5rem; border-radius: 999px; font-weight: 800; font-size: 0.875rem; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 14px rgba(0,0,0,0.2); }
        .cf-save-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .cf-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cf-btn-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: cf-spin 0.7s linear infinite; }
        @keyframes cf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .cf-cancel-btn { display: inline-flex; align-items: center; padding: 0.7rem 1.25rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem; border: 1.5px solid var(--border); color: var(--muted-foreground); text-decoration: none; transition: all 0.2s; background: var(--card); }
        .cf-cancel-btn:hover { border-color: var(--foreground); color: var(--foreground); }
      `}</style>
    </div>
  );
}
