"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, BarChart3, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function EditStatisticPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isRtl = locale === "ar";
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ value: "", labelEn: "", labelAr: "", sortOrder: 0, isActive: true });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  useEffect(() => {
    adminApi.getStatistic(Number(params.id)).then((res) => {
      const s = res.data;
      setForm({ value: s.value, labelEn: s.labelEn, labelAr: s.labelAr, sortOrder: s.sortOrder, isActive: s.isActive });
    }).catch(() => router.push("/admin/statistics")).finally(() => setLoading(false));
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminApi.updateStatistic(Number(params.id), form);
      router.push("/admin/statistics");
    } catch (err: any) {
      setError(err.message || (isRtl ? "حدث خطأ ما" : "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="cf-root">
      <div className="cf-header">
        <Link href="/admin/statistics" className="cf-back">
          <ArrowLeft className="size-4" />
          {isRtl ? "العودة للإحصائيات" : "Back to Statistics"}
        </Link>
        <div className="cf-title-row">
          <div className="cf-title-icon" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
            <BarChart3 className="size-5 text-white" />
          </div>
          <div>
            <h1 className="cf-title">{isRtl ? "تعديل الإحصاء" : "Edit Statistic"}</h1>
            <p className="cf-sub">{form.labelEn}</p>
          </div>
        </div>
      </div>

      {error && <div className="cf-error">{error}</div>}

      <form onSubmit={handleSubmit} className="cf-form">
        <div className="cf-section">
          <h2 className="cf-section-title">{isRtl ? "معلومات الإحصاء" : "Statistic Information"}</h2>
          <div className="cf-grid-2">
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "القيمة" : "Value"} <span className="cf-req">*</span></label>
              <input className="cf-input" value={form.value} onChange={e => set("value", e.target.value)} required placeholder="e.g. 500+" />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "ترتيب الظهور" : "Sort Order"}</label>
              <input className="cf-input" type="number" min="0" value={form.sortOrder} onChange={e => set("sortOrder", Number(e.target.value))} />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "العنوان بالإنجليزية" : "Label (English)"} <span className="cf-req">*</span></label>
              <input className="cf-input" value={form.labelEn} onChange={e => set("labelEn", e.target.value)} required />
            </div>
            <div className="cf-field">
              <label className="cf-label">{isRtl ? "العنوان بالعربية" : "Label (Arabic)"} <span className="cf-req">*</span></label>
              <input className="cf-input" value={form.labelAr} onChange={e => set("labelAr", e.target.value)} required dir="rtl" />
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
          <button type="submit" disabled={saving} className="cf-save-btn" style={{ background: "#8b5cf6" }}>
            {saving ? (
              <><div className="cf-btn-spinner" />{isRtl ? "جاري الحفظ..." : "Saving..."}</>
            ) : (
              <><Save className="size-4" />{isRtl ? "حفظ التغييرات" : "Save Changes"}</>
            )}
          </button>
          <Link href="/admin/statistics" className="cf-cancel-btn">{isRtl ? "إلغاء" : "Cancel"}</Link>
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
        .cf-checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; padding-top: 0.5rem; }
        .cf-checkbox-label input { width: 18px; height: 18px; accent-color: #8b5cf6; }
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
