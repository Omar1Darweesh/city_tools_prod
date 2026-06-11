"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react";
import { ArrowLeft, Save, Shield, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

const iconOptions = [
  { value: "Truck", labelEn: "Truck", labelAr: "شاحنة" },
  { value: "Shield", labelEn: "Shield", labelAr: "درع" },
  { value: "BadgePercent", labelEn: "Badge Percent", labelAr: "شارة نسبة" },
  { value: "HeadphonesIcon", labelEn: "Headphones", labelAr: "سماعات" },
  { value: "Zap", labelEn: "Zap", labelAr: "برق" },
  { value: "Wrench", labelEn: "Wrench", labelAr: "مفتاح" },
  { value: "Package", labelEn: "Package", labelAr: "حزمة" },
  { value: "Bolt", labelEn: "Bolt", labelAr: "صاعقة" },
  { value: "Droplets", labelEn: "Droplets", labelAr: "قطرات" },
  { value: "Factory", labelEn: "Factory", labelAr: "مصنع" },
  { value: "Star", labelEn: "Star", labelAr: "نجمة" },
  { value: "Check", labelEn: "Check", labelAr: "علامة" },
  { value: "DollarSign", labelEn: "Dollar Sign", labelAr: "دولار" },
];

export default function NewTrustFeaturePage() {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ icon: "Shield", titleEn: "", titleAr: "", subtitleEn: "", subtitleAr: "", sortOrder: 0, isActive: true });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.titleEn.trim()) {
      setError(isRtl ? "يرجى إدخال العنوان" : "Please enter the title");
      return;
    }
    setSaving(true);
    try {
      await adminApi.createTrustFeature(form);
      router.push("/admin/trust-features");
    } catch (err: any) {
      setError(err.message || (isRtl ? "حدث خطأ" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cf-root">
      <div className="cf-header">
        <Link href="/admin/trust-features" className="cf-back">
          <ArrowLeft className="size-4" />
          {isRtl ? "العودة" : "Back"}
        </Link>
        <div className="cf-title-row">
          <div className="cf-title-icon" style={{ background: "linear-gradient(135deg, #C0161B, #e83030)" }}>
            <Shield className="size-5 text-white" />
          </div>
          <div>
            <h1 className="cf-title">{isRtl ? "إضافة ميزة جديدة" : "New Trust Feature"}</h1>
            <p className="cf-sub">{isRtl ? "إضافة ميزة جديدة لشريط الثقة في الصفحة الرئيسية" : "Add a new feature to the homepage trust bar"}</p>
          </div>
        </div>
      </div>

      {error && <div className="cf-error">{error}</div>}

      <form onSubmit={handleSubmit} className="cf-form">
        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "تفاصيل الميزة" : "Feature Details"}</h2>
          <div className="cf-grid-2">
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "الأيقونة" : "Icon"}</label>
              <select className="cf-input cf-select" value={form.icon} onChange={(e) => set("icon", e.target.value)}>
                {iconOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{isRtl ? opt.labelAr : opt.labelEn}</option>
                ))}
              </select>
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "الترتيب" : "Sort Order"}</label>
              <input className="cf-input" type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "العنوان (إنجليزي)" : "Title (English)"} <span className="cf-req">*</span></label>
              <input className="cf-input" value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} required />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "العنوان (عربي)" : "Title (Arabic)"}</label>
              <input className="cf-input" value={form.titleAr} onChange={(e) => set("titleAr", e.target.value)} dir="rtl" />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "النص الفرعي (إنجليزي)" : "Subtitle (English)"}</label>
              <input className="cf-input" value={form.subtitleEn} onChange={(e) => set("subtitleEn", e.target.value)} />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "النص الفرعي (عربي)" : "Subtitle (Arabic)"}</label>
              <input className="cf-input" value={form.subtitleAr} onChange={(e) => set("subtitleAr", e.target.value)} dir="rtl" />
            </div>
            <div className="cf-field cf-field-full">
              <label className="cf-checkbox-label">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
                <span>{isRtl ? "نشط" : "Active"}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="cf-actions">
          <button type="submit" disabled={saving} className="cf-save-btn" style={{ background: "#C0161B" }}>
            {saving ? (
              <><div className="cf-btn-spinner" />{isRtl ? "جاري الحفظ..." : "Saving..."}</>
            ) : (
              <><Save className="size-4" />{isRtl ? "حفظ" : "Save"}</>
            )}
          </button>
          <Link href="/admin/trust-features" className="cf-cancel-btn">{isRtl ? "إلغاء" : "Cancel"}</Link>
        </div>
      </form>

      <style>{`
        .cf-root { display: flex; flex-direction: column; gap: 1.5rem; max-width: 640px; }
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
        .cf-input { background: var(--background); border: 1.5px solid var(--border); border-radius: 0.75rem; padding: 0.6rem 0.875rem; font-size: 0.875rem; color: var(--foreground); font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%; box-sizing: border-box; }
        .cf-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(192,22,27,0.12); }
        .cf-select { appearance: auto; cursor: pointer; }
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
